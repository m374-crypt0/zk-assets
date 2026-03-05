use super::main;
use super::types::{Policy, PolicyScope, PolicyScopeParameters, PrivateInputs, Request};
use ::poseidon::poseidon2::Poseidon2;

fn create_zero_commitment_inputs() -> (PrivateInputs, Policy, Request) {
    let private_inputs = PrivateInputs { customer_id: 0, customer_secret: 0, authorized_sender: 0 };
    let policy = Policy {
        id: 0,
        scope: PolicyScope { id: 0, parameters: PolicyScopeParameters { valid_until: 0 } },
    };
    let request = Request { sender: 0, current_timestamp: 0, commitment: 0 };

    (private_inputs, policy, request)
}

#[test(should_fail_with = "Unauthorized sender")]
fn test_main_fails_with_unmatched_sender_addresses() {
    let (private_inputs, policy, mut request) = create_zero_commitment_inputs();
    request.sender = 1;

    main(private_inputs, policy, request);
}

#[test(should_fail_with = "Time limit exceeded")]
fn test_main_fails_with_current_timestamp_exceeding_valid_until() {
    let (private_inputs, mut policy, mut request) = create_zero_commitment_inputs();
    policy.scope.parameters.valid_until = 1;
    request.current_timestamp = 2;

    main(private_inputs, policy, request);
}

#[test(should_fail_with = "Invalid commitment value")]
fn test_main_fails_with_unmatched_commitment_and_input_hashes() {
    let (private_inputs, policy, request) = create_zero_commitment_inputs();

    main(private_inputs, policy, request);
}

#[test]
fn test_main_succeeds_with_matching_commitment_and_input_hashes() {
    let private_inputs = PrivateInputs {
        customer_id: 42,
        customer_secret: 99,
        authorized_sender: 0x240aca6E8bfa428367728649Abf452053a9FFb55,
    };
    let policy = Policy {
        id: 0,
        scope: PolicyScope { id: 0, parameters: PolicyScopeParameters { valid_until: 1770297431 } },
    };

    let commitment = Poseidon2::hash(
        [
            private_inputs.customer_id,
            private_inputs.customer_secret,
            private_inputs.authorized_sender,
            policy.id,
            policy.scope.id,
            policy.scope.parameters.valid_until,
        ],
        6,
    );

    let request = Request {
        sender: private_inputs.authorized_sender,
        current_timestamp: policy.scope.parameters.valid_until,
        commitment: commitment,
    };

    main(private_inputs, policy, request);
}
