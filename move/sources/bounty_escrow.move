/// BountyChain - Simple Bug Bounty Platform on Sui
/// Create bounty → Lock SUI → Approve report → Auto-pay hacker
module bountychain::bounty_escrow {
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::event;

    // Errors
    const EInvalidAmount: u64 = 0;
    const ENotOwner: u64 = 1;
    const ENotActive: u64 = 2;
    const EInsufficientBalance: u64 = 3;

    // Bounty object - holds locked SUI
    public struct Bounty has key {
        id: UID,
        owner: address,
        title: vector<u8>,
        reward: Balance<SUI>,
        is_active: bool,
    }

    // Events
    public struct BountyCreated has copy, drop {
        bounty_id: ID,
        owner: address,
        reward: u64,
    }

    public struct PaymentReleased has copy, drop {
        bounty_id: ID,
        hacker: address,
        amount: u64,
    }

    // Create bounty and lock reward
    entry fun create_bounty(
        title: vector<u8>,
        reward: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let reward_value = coin::value(&reward);
        assert!(reward_value > 0, EInvalidAmount);

        let uid = object::new(ctx);
        let bounty_id = object::uid_to_inner(&uid);

        event::emit(BountyCreated {
            bounty_id,
            owner: tx_context::sender(ctx),
            reward: reward_value,
        });

        let bounty = Bounty {
            id: uid,
            owner: tx_context::sender(ctx),
            title,
            reward: coin::into_balance(reward),
            is_active: true,
        };

        transfer::share_object(bounty);
    }

    // Approve and pay hacker
    entry fun approve_and_pay(
        bounty: &mut Bounty,
        hacker: address,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == bounty.owner, ENotOwner);
        assert!(bounty.is_active, ENotActive);
        
        let amount = balance::value(&bounty.reward);
        assert!(amount > 0, EInsufficientBalance);

        let payment = coin::from_balance(
            balance::withdraw_all(&mut bounty.reward),
            ctx
        );

        transfer::public_transfer(payment, hacker);
        bounty.is_active = false;

        event::emit(PaymentReleased {
            bounty_id: object::uid_to_inner(&bounty.id),
            hacker,
            amount,
        });
    }

    // Cancel and refund
    entry fun cancel_bounty(
        bounty: &mut Bounty,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == bounty.owner, ENotOwner);
        assert!(bounty.is_active, ENotActive);

        let amount = balance::value(&bounty.reward);
        if (amount > 0) {
            let refund = coin::from_balance(
                balance::withdraw_all(&mut bounty.reward),
                ctx
            );
            transfer::public_transfer(refund, bounty.owner);
        };

        bounty.is_active = false;
    }
}
