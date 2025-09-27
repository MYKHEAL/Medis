// IPFS integration with file encryption for medical records
'use client';

import { unixfs } from '@helia/unixfs';
import { createHelia } from 'helia';
import CryptoJS from 'crypto-js';

// File encryption utilities
export class FileEncryption {
  private static readonly ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'default-medical-key';

  static encrypt(data: string): string {
    return CryptoJS.AES.encrypt(data, this.ENCRYPTION_KEY).toString();
  }

  static decrypt(encryptedData: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  static encryptFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const fileContent = event.target?.result as string;
          const encrypted = this.encrypt(fileContent);
          resolve(encrypted);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  static decryptToFile(encryptedData: string, fileName: string, mimeType: string): File {
    const decrypted = this.decrypt(encryptedData);
    // Convert base64 back to blob
    const byteCharacters = atob(decrypted.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    return new File([blob], fileName, { type: mimeType });
  }
}

// IPFS utilities using Helia
export class IPFSManager {
  private static helia: any = null;
  private static fs: any = null;

  static async initialize() {
    if (!this.helia) {
      this.helia = await createHelia();
      this.fs = unixfs(this.helia);
    }
    return { helia: this.helia, fs: this.fs };
  }

  static async uploadEncryptedFile(file: File): Promise<string> {
    try {
      const { fs } = await this.initialize();
      
      // Encrypt the file first
      const encryptedContent = await FileEncryption.encryptFile(file);
      
      // Convert encrypted string to Uint8Array
      const encoder = new TextEncoder();
      const data = encoder.encode(encryptedContent);
      
      // Add to IPFS
      const cid = await fs.addBytes(data);
      
      return cid.toString();
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      throw new Error('Failed to upload file to IPFS');
    }
  }

  static async downloadEncryptedFile(cid: string): Promise<Uint8Array> {
    try {
      const { fs } = await this.initialize();
      
      // Get file from IPFS
      const chunks: Uint8Array[] = [];
      for await (const chunk of fs.cat(cid)) {
        chunks.push(chunk);
      }
      
      // Combine chunks
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
      
      return result;
    } catch (error) {
      console.error('Error downloading from IPFS:', error);
      throw new Error('Failed to download file from IPFS');
    }
  }

  static async getEncryptedFileAsString(cid: string): Promise<string> {
    const data = await this.downloadEncryptedFile(cid);
    const decoder = new TextDecoder();
    return decoder.decode(data);
  }

  static async decryptAndDownloadFile(
    cid: string, 
    fileName: string, 
    mimeType: string = 'application/octet-stream'
  ): Promise<File> {
    try {
      const encryptedData = await this.getEncryptedFileAsString(cid);
      return FileEncryption.decryptToFile(encryptedData, fileName, mimeType);
    } catch (error) {
      console.error('Error decrypting file:', error);
      throw new Error('Failed to decrypt and download file');
    }
  }

  static generateIPFSUrl(cid: string): string {
    const gateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/';
    return `${gateway}${cid}`;
  }

  static async stop() {
    if (this.helia) {
      await this.helia.stop();
      this.helia = null;
      this.fs = null;
    }
  }
}

// Medical record file types
export interface MedicalFile {
  id: string;
  name: string;
  type: string;
  size: number;
  ipfsHash: string;
  uploadDate: Date;
  encrypted: boolean;
}

// Utility functions for medical file management
export class MedicalFileManager {
  static validateMedicalFile(file: File): { valid: boolean; error?: string } {
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 10MB' };
    }

    // Check file types (common medical file formats)
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/tiff',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/dicom'
    ];

    if (!allowedTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: 'File type not supported. Please upload PDF, DOC, TXT, or image files.' 
      };
    }

    return { valid: true };
  }

  static async uploadMedicalRecord(
    file: File, 
    patientAddress: string,
    hospitalAddress: string
  ): Promise<{ ipfsHash: string; medicalFile: MedicalFile }> {
    // Validate file
    const validation = this.validateMedicalFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Upload to IPFS
    const ipfsHash = await IPFSManager.uploadEncryptedFile(file);

    // Create medical file record
    const medicalFile: MedicalFile = {
      id: crypto.randomUUID(),
      name: file.name,
      type: file.type,
      size: file.size,
      ipfsHash,
      uploadDate: new Date(),
      encrypted: true,
    };

    return { ipfsHash, medicalFile };
  }

  static async downloadMedicalRecord(
    ipfsHash: string, 
    fileName: string,
    mimeType: string
  ): Promise<File> {
    return await IPFSManager.decryptAndDownloadFile(ipfsHash, fileName, mimeType);
  }

  static createDownloadUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  static revokeDownloadUrl(url: string): void {
    URL.revokeObjectURL(url);
  }
}

// React hook for IPFS operations
export function useIPFS() {
  const uploadFile = async (file: File) => {
    return await IPFSManager.uploadEncryptedFile(file);
  };

  const downloadFile = async (cid: string, fileName: string, mimeType: string) => {
    return await IPFSManager.decryptAndDownloadFile(cid, fileName, mimeType);
  };

  const uploadMedicalRecord = async (
    file: File,
    patientAddress: string,
    hospitalAddress: string
  ) => {
    return await MedicalFileManager.uploadMedicalRecord(file, patientAddress, hospitalAddress);
  };

  const downloadMedicalRecord = async (
    ipfsHash: string,
    fileName: string,
    mimeType: string
  ) => {
    return await MedicalFileManager.downloadMedicalRecord(ipfsHash, fileName, mimeType);
  };

  return {
    uploadFile,
    downloadFile,
    uploadMedicalRecord,
    downloadMedicalRecord,
    validateFile: MedicalFileManager.validateMedicalFile,
    createDownloadUrl: MedicalFileManager.createDownloadUrl,
    revokeDownloadUrl: MedicalFileManager.revokeDownloadUrl,
  };
}