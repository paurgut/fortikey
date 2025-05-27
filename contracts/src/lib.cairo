#[starknet::contract]
mod mi_proyecto_cairo {
    use starknet::ContractAddress;

    #[storage]
    struct Storage {
        last_token: felt252,
    }

    #[external(v0)]
    fn generate_token(ref self: ContractState, user_id: felt252) {
        let block = starknet::get_block_info().block_number;
        let block_as_felt: felt252 = block.into(); // Conversión simple
        let token = user_id * block_as_felt;
        self.last_token.write(token);
    }

    #[external(v0)]
    fn get_last_token(self: @ContractState) -> felt252 {
        self.last_token.read()
    }
}
