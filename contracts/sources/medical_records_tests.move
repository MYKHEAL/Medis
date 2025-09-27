#[test_only]
module medis_dapp::medical_records_tests {
    use medis_dapp::medical_records::{Self, AdminCap, HospitalRegistry, MedicalRecord, MedicalRecordRegistry};
    use sui::test_scenario::{Self, Scenario};
    use sui::clock::{Self, Clock};
    use std::string;

    const ADMIN: address = @0xAD;
    const HOSPITAL: address = @0x123;
    const PATIENT: address = @0x456;

    #[test]
    fun test_admin_creation() {
        let mut scenario_val = test_scenario::begin(ADMIN);
        let scenario = &mut scenario_val;

        // Initialize the module
        medical_records::init_for_testing(test_scenario::ctx(scenario));

        test_scenario::next_tx(scenario, ADMIN);
        {
            // Check if admin cap was created
            assert!(test_scenario::has_most_recent_for_sender<AdminCap>(scenario), 0);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    fun test_hospital_registration() {
        let mut scenario_val = test_scenario::begin(ADMIN);
        let scenario = &mut scenario_val;

        // Initialize the module
        medical_records::init_for_testing(test_scenario::ctx(scenario));

        test_scenario::next_tx(scenario, ADMIN);
        {
            let admin_cap = test_scenario::take_from_sender<AdminCap>(scenario);
            let registry = test_scenario::take_shared<HospitalRegistry>(scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            medical_records::register_hospital(
                &admin_cap,
                &mut registry,
                HOSPITAL,
                b"Test Hospital",
                &clock,
                test_scenario::ctx(scenario)
            );

            // Verify hospital is registered
            assert!(medical_records::is_registered_hospital(&registry, HOSPITAL), 0);

            clock::destroy_for_testing(clock);
            test_scenario::return_to_sender(scenario, admin_cap);
            test_scenario::return_shared(registry);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    fun test_medical_record_issuance() {
        let mut scenario_val = test_scenario::begin(ADMIN);
        let scenario = &mut scenario_val;

        // Initialize the module
        medical_records::init_for_testing(test_scenario::ctx(scenario));

        // Register hospital first
        test_scenario::next_tx(scenario, ADMIN);
        {
            let admin_cap = test_scenario::take_from_sender<AdminCap>(scenario);
            let registry = test_scenario::take_shared<HospitalRegistry>(scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            medical_records::register_hospital(
                &admin_cap,
                &mut registry,
                HOSPITAL,
                b"Test Hospital",
                &clock,
                test_scenario::ctx(scenario)
            );

            clock::destroy_for_testing(clock);
            test_scenario::return_to_sender(scenario, admin_cap);
            test_scenario::return_shared(registry);
        };

        // Issue medical record
        test_scenario::next_tx(scenario, HOSPITAL);
        {
            let registry = test_scenario::take_shared<HospitalRegistry>(scenario);
            let record_registry = test_scenario::take_shared<MedicalRecordRegistry>(scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            medical_records::issue_record(
                &registry,
                &mut record_registry,
                PATIENT,
                b"QmTestHash123",
                1234567890,
                &clock,
                test_scenario::ctx(scenario)
            );

            clock::destroy_for_testing(clock);
            test_scenario::return_shared(registry);
            test_scenario::return_shared(record_registry);
        };

        // Check if patient received the record
        test_scenario::next_tx(scenario, PATIENT);
        {
            assert!(test_scenario::has_most_recent_for_address<MedicalRecord>(PATIENT), 0);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    #[expected_failure(abort_code = medical_records::ENotRegisteredHospital)]
    fun test_unregistered_hospital_cannot_issue_record() {
        let mut scenario_val = test_scenario::begin(ADMIN);
        let scenario = &mut scenario_val;

        // Initialize the module
        medical_records::init_for_testing(test_scenario::ctx(scenario));

        // Try to issue record without registering hospital
        test_scenario::next_tx(scenario, HOSPITAL);
        {
            let registry = test_scenario::take_shared<HospitalRegistry>(scenario);
            let record_registry = test_scenario::take_shared<MedicalRecordRegistry>(scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));

            medical_records::issue_record(
                &registry,
                &mut record_registry,
                PATIENT,
                b"QmTestHash123",
                1234567890,
                &clock,
                test_scenario::ctx(scenario)
            );

            clock::destroy_for_testing(clock);
            test_scenario::return_shared(registry);
            test_scenario::return_shared(record_registry);
        };

        test_scenario::end(scenario_val);
    }
}