pub(crate) struct PrivateInputs {
    pub(crate) customer_id: Field,
    pub(crate) customer_secret: Field,
    pub(crate) authorized_sender: Field,
}

pub(crate) struct PolicyScopeParameters {
    pub(crate) valid_until: Field,
}

pub(crate) struct PolicyScope {
    pub(crate) id: Field,
    pub(crate) parameters: PolicyScopeParameters,
}

pub(crate) struct Policy {
    pub(crate) id: Field,
    pub(crate) scope: PolicyScope,
}

pub(crate) struct Request {
    pub(crate) sender: Field,
    pub(crate) commitment: Field,
}
