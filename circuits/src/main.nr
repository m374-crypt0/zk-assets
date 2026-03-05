mod types;
mod utility;
mod tests;

use types::{Policy, PrivateInputs, Request};
use utility::create_commitment_from_inputs;

pub(crate) fn main(private_inputs: PrivateInputs, policy: pub Policy, request: pub Request) {
    assert_eq(request.sender, private_inputs.authorized_sender, "Unauthorized sender");
    assert(
        request.current_timestamp as u32 <= policy.scope.parameters.valid_until as u32,
        "Time limit exceeded",
    );

    assert_eq(
        request.commitment,
        create_commitment_from_inputs(private_inputs, policy),
        "Invalid commitment value",
    );
}
