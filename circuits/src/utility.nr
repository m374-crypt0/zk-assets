use crate::types::{Policy, PrivateInputs};
type Poseidon2 = ::poseidon::poseidon2::Poseidon2;

pub(crate) fn create_commitment_from_inputs(
    private_inputs: PrivateInputs,
    policy: Policy,
) -> Field {
    let hash = Poseidon2::hash(
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

    hash
}
