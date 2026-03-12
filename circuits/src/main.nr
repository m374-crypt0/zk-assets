mod types;
mod utility;
mod tests;

use types::{Policy, PrivateInputs, Request};
use utility::create_commitment_from_inputs;

pub(crate) fn main(private_inputs: PrivateInputs, policy: pub Policy, request: pub Request) {
    assert_eq(request.sender, private_inputs.authorized_sender, "Unauthorized sender");

    assert_eq(
        request.commitment,
        create_commitment_from_inputs(private_inputs, policy),
        "Invalid commitment value",
    );
}
