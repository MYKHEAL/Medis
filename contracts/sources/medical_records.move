/// Medis dApp - Decentralized Medical Records System
/// This module provides functionality for managing medical records on Sui blockchain
/// with role-based access control for Admin, Hospitals, and Patients

module medis_dapp::medical_records {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::table::{Self, Table};
    use std::string::{Self, String};
    use sui::event;
    use sui::clock::{Self, Clock};

    // ===== Error codes =====
    const ENotAdmin: u64 = 1;
    const ENotRegisteredHospital: u64 = 2;
    const EHospitalAlreadyRegistered: u64 = 3;
    const EAdminAlreadyExists: u64 = 4;

    // ===== Structs =====

    /// Admin capability - only one exists
    public struct AdminCap has key, store {
        id: UID,
    }

    /// Hospital registry containing all registered hospitals
    public struct HospitalRegistry has key {
        id: UID,
        hospitals: Table<address, HospitalInfo>,
        admin: address,
    }

    /// Hospital information
    public struct HospitalInfo has store {
        name: String,
        address: address,
        registered_at: u64,
    }

    /// Medical record object
    public struct MedicalRecord has key, store {
        id: UID,
        patient_address: address,
        hospital_address: address,
        ipfs_hash: String,
        timestamp: u64,
        created_at: u64,
    }

    /// Shared object for tracking issued records
    public struct MedicalRecordRegistry has key {
        id: UID,
        records_count: u64,
    }

    // ===== Events =====

    public struct AdminCreated has copy, drop {
        admin_address: address,
    }

    public struct HospitalRegistered has copy, drop {
        hospital_address: address,
        hospital_name: String,
        registered_by: address,
    }

    public struct MedicalRecordIssued has copy, drop {
        record_id: ID,
        patient_address: address,
        hospital_address: address,
        ipfs_hash: String,
        timestamp: u64,
    }

    // ===== Functions =====

    /// Initialize the medical records system
    /// Creates admin capability and hospital registry
    fun init(ctx: &mut TxContext) {
        let admin_cap = AdminCap {
            id: object::new(ctx),
        };

        let hospital_registry = HospitalRegistry {
            id: object::new(ctx),
            hospitals: table::new(ctx),
            admin: tx_context::sender(ctx),
        };

        let record_registry = MedicalRecordRegistry {
            id: object::new(ctx),
            records_count: 0,
        };

        // Transfer admin capability to the deployer
        transfer::transfer(admin_cap, tx_context::sender(ctx));
        
        // Share the registries
        transfer::share_object(hospital_registry);
        transfer::share_object(record_registry);

        // Emit admin created event
        event::emit(AdminCreated {
            admin_address: tx_context::sender(ctx),
        });
    }

    /// Create admin capability (only during initialization)
    public entry fun create_admin(ctx: &mut TxContext) {
        let admin_cap = AdminCap {
            id: object::new(ctx),
        };

        transfer::transfer(admin_cap, tx_context::sender(ctx));

        event::emit(AdminCreated {
            admin_address: tx_context::sender(ctx),
        });
    }

    /// Register a new hospital (only admin can call this)
    public entry fun register_hospital(
        _admin_cap: &AdminCap,
        registry: &mut HospitalRegistry,
        hospital_address: address,
        hospital_name: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Check if hospital is already registered
        assert!(!table::contains(&registry.hospitals, hospital_address), EHospitalAlreadyRegistered);

        let hospital_info = HospitalInfo {
            name: string::utf8(hospital_name),
            address: hospital_address,
            registered_at: clock::timestamp_ms(clock),
        };

        table::add(&mut registry.hospitals, hospital_address, hospital_info);

        event::emit(HospitalRegistered {
            hospital_address,
            hospital_name: string::utf8(hospital_name),
            registered_by: tx_context::sender(ctx),
        });
    }

    /// Issue a medical record (only registered hospitals can call this)
    public entry fun issue_record(
        registry: &HospitalRegistry,
        record_registry: &mut MedicalRecordRegistry,
        patient_address: address,
        ipfs_hash: vector<u8>,
        timestamp: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let hospital_address = tx_context::sender(ctx);
        
        // Check if hospital is registered
        assert!(table::contains(&registry.hospitals, hospital_address), ENotRegisteredHospital);

        let record = MedicalRecord {
            id: object::new(ctx),
            patient_address,
            hospital_address,
            ipfs_hash: string::utf8(ipfs_hash),
            timestamp,
            created_at: clock::timestamp_ms(clock),
        };

        let record_id = object::id(&record);

        // Increment records count
        record_registry.records_count = record_registry.records_count + 1;

        // Transfer the record to the patient
        transfer::transfer(record, patient_address);

        event::emit(MedicalRecordIssued {
            record_id,
            patient_address,
            hospital_address,
            ipfs_hash: string::utf8(ipfs_hash),
            timestamp,
        });
    }

    // ===== View Functions =====

    /// Check if an address is a registered hospital
    public fun is_registered_hospital(
        registry: &HospitalRegistry,
        hospital_address: address
    ): bool {
        table::contains(&registry.hospitals, hospital_address)
    }

    /// Get hospital information
    public fun get_hospital_info(
        registry: &HospitalRegistry,
        hospital_address: address
    ): (String, address, u64) {
        assert!(table::contains(&registry.hospitals, hospital_address), ENotRegisteredHospital);
        let hospital_info = table::borrow(&registry.hospitals, hospital_address);
        (hospital_info.name, hospital_info.address, hospital_info.registered_at)
    }

    /// Get medical record details
    public fun get_record_details(record: &MedicalRecord): (address, address, String, u64, u64) {
        (
            record.patient_address,
            record.hospital_address,
            record.ipfs_hash,
            record.timestamp,
            record.created_at
        )
    }

    /// Get total records count
    public fun get_records_count(registry: &MedicalRecordRegistry): u64 {
        registry.records_count
    }

    /// Get admin address from registry
    public fun get_admin_address(registry: &HospitalRegistry): address {
        registry.admin
    }

    // ===== Test-only functions =====
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}