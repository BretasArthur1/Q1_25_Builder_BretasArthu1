mod programs;

#[cfg(test)]
mod tests {
    use crate::programs::Turbin3_prereq::{CompleteArgs, Turbin3PrereqProgram, UpdateArgs};
    use solana_client::rpc_client::RpcClient;
    use solana_program::{pubkey::Pubkey, system_instruction::transfer, system_program};
    use solana_sdk::{
        message::Message,
        signature::{read_keypair_file, Keypair, Signer},
        transaction::Transaction,
    };
    use std::str::FromStr;

    const RPC_URL: &str = "https://api.devnet.solana.com/";

    #[test]
    fn keygen() {
        // Generate a new keypair
        let keypair = Keypair::new();
        println!(
            "New Solana wallet generated: {}",
            keypair.pubkey()
        );
        println!("\nSave your wallet by copying the following into a JSON file:");
        println!("{:?}", keypair.to_bytes());
    }

    #[test]
    fn airdrop() {
        let keypair = read_keypair_file("dev-wallet.json").expect("Wallet file not found");
        let client = RpcClient::new(RPC_URL);
        match client.request_airdrop(&keypair.pubkey(), 2_000_000_000u64) {
            Ok(signature) => {
                println!("Airdrop successful! View your transaction at:");
                println!(
                    "https://explorer.solana.com/tx/{}?cluster=devnet",
                    signature
                );
            }
            Err(e) => println!("Airdrop failed: {}", e),
        }
    }

    #[test]
    fn transfer_sol() {
        let keypair = read_keypair_file("dev-wallet.json").expect("Wallet file not found");
        let recipient_pubkey = Pubkey::from_str("3pKiN8Q59NEUh4UsopfGAz3vJKJQGEfFnNDscqpxaqVW").unwrap();
        let rpc_client = RpcClient::new(RPC_URL);
        let recent_blockhash = rpc_client
            .get_latest_blockhash()
            .expect("Failed to retrieve recent blockhash");
        
        let transaction = Transaction::new_signed_with_payer(
            &[transfer(&keypair.pubkey(), &recipient_pubkey, 1_000_000)],
            Some(&keypair.pubkey()),
            &[&keypair],
            recent_blockhash,
        );

        let signature = rpc_client
            .send_and_confirm_transaction(&transaction)
            .expect("Transaction failed");
        
        println!(
            "Transfer successful! View your transaction at: https://explorer.solana.com/tx/{}/?cluster=devnet",
            signature
        );
    }

    #[test]
    fn empty_wallet() {
        let keypair = read_keypair_file("dev-wallet.json").expect("Wallet file not found");
        let recipient_pubkey = Pubkey::from_str("3pKiN8Q59NEUh4UsopfGAz3vJKJQGEfFnNDscqpxaqVW").unwrap();
        let rpc_client = RpcClient::new(RPC_URL);
        let recent_blockhash = rpc_client
            .get_latest_blockhash()
            .expect("Failed to retrieve recent blockhash");

        let balance = rpc_client
            .get_balance(&keypair.pubkey())
            .expect("Failed to get balance");

        let message = Message::new_with_blockhash(
            &[transfer(&keypair.pubkey(), &recipient_pubkey, balance)],
            Some(&keypair.pubkey()),
            &recent_blockhash,
        );

        let fee = rpc_client
            .get_fee_for_message(&message)
            .expect("Failed to get fee");

        let transaction = Transaction::new_signed_with_payer(
            &[transfer(&keypair.pubkey(), &recipient_pubkey, balance - fee)],
            Some(&keypair.pubkey()),
            &[&keypair],
            recent_blockhash,
        );

        let signature = rpc_client
            .send_and_confirm_transaction(&transaction)
            .expect("Transaction failed");
        
        println!(
            "Wallet emptied! View your transaction at: https://explorer.solana.com/tx/{}/?cluster=devnet",
            signature
        );
    }

    #[test]
    fn enroll() {
        let rpc_client = RpcClient::new(RPC_URL);
        let signer = read_keypair_file("turbin3-wallet.json").expect("Couldn't find wallet file");
        let prereq = Turbin3PrereqProgram::derive_program_address(&[
            b"prereq",
            signer.pubkey().to_bytes().as_ref(),
        ]);
        let args = CompleteArgs {
            github: b"BretasArthur1".to_vec(),
        };
        let blockhash = rpc_client.get_latest_blockhash().expect(
            "Failed to get recent
            blockhash",
        );
        let transaction = Turbin3PrereqProgram::complete(
            &[&signer.pubkey(), &prereq, &system_program::id()],
            &args,
            Some(&signer.pubkey()),
            &[&signer],
            blockhash,
        );

        let signature = rpc_client
            .send_and_confirm_transaction(&transaction)
            .expect("Failed to send transaction");
        println!(
            "Success! Check out your TX here:
            https://explorer.solana.com/tx/{}/?cluster=devnet",
            signature
        );
    }
}