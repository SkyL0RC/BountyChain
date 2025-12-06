module bountychain::mini_hack {
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::clock::{Self, Clock};
    use sui::event;
    use std::string::{Self, String};

    // ============= Errors =============
    const EMiniHackNotActive: u64 = 0;
    const EMiniHackAlreadyClaimed: u64 = 1;
    const EInvalidSolution: u64 = 2;
    const ENotWeeklyReset: u64 = 3;

    // ============= Structs =============
    
    /// Haftalık mini hack challenge
    public struct MiniHack has key {
        id: UID,
        week_number: u64,
        title: String,
        description: String,
        challenges: vector<Challenge>,
        total_pool: u64,
        pool_balance: Balance<SUI>,
        start_time: u64,
        end_time: u64, // 7 gün sonra
        is_active: bool,
    }

    /// Her hafta 3-5 kolay görev
    public struct Challenge has store, drop, copy {
        task: String,
        reward: u64,
        solution_hash: vector<u8>, // Doğru çözümün hash'i
        winner: Option<address>,
        is_claimed: bool,
    }

    /// Global mini hack registry
    public struct MiniHackRegistry has key {
        id: UID,
        current_week: u64,
        total_weeks: u64,
        total_distributed: u64,
        next_reset: u64, // Her Cuma 00:00 UTC
    }

    // ============= Events =============
    
    public struct MiniHackCreated has copy, drop {
        week_number: u64,
        total_pool: u64,
        challenges_count: u64,
    }

    public struct MiniHackSolved has copy, drop {
        week_number: u64,
        challenge_index: u64,
        solver: address,
        reward: u64,
    }

    // ============= Init =============
    
    fun init(ctx: &mut TxContext) {
        let registry = MiniHackRegistry {
            id: object::new(ctx),
            current_week: 1,
            total_weeks: 0,
            total_distributed: 0,
            next_reset: 0, // İlk MiniHack oluşturulduğunda set edilecek
        };
        transfer::share_object(registry);
    }

    // ============= Public Functions =============
    
    /// Yeni haftalık mini hack oluştur (her Cuma admin tarafından)
    public entry fun create_weekly_mini_hack(
        registry: &mut MiniHackRegistry,
        title: vector<u8>,
        description: vector<u8>,
        challenge_tasks: vector<vector<u8>>, // 3-5 görev
        challenge_rewards: vector<u64>, // Her görev için reward
        challenge_solutions: vector<vector<u8>>, // Solution hash'leri
        pool: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let current_time = clock::timestamp_ms(clock);
        let pool_amount = coin::value(&pool);

        let mut challenges = vector::empty<Challenge>();
        let len = vector::length(&challenge_tasks);
        let mut i = 0;
        
        while (i < len) {
            let challenge = Challenge {
                task: string::utf8(*vector::borrow(&challenge_tasks, i)),
                reward: *vector::borrow(&challenge_rewards, i),
                solution_hash: *vector::borrow(&challenge_solutions, i),
                winner: option::none(),
                is_claimed: false,
            };
            vector::push_back(&mut challenges, challenge);
            i = i + 1;
        };

        let mini_hack = MiniHack {
            id: object::new(ctx),
            week_number: registry.current_week,
            title: string::utf8(title),
            description: string::utf8(description),
            challenges,
            total_pool: pool_amount,
            pool_balance: coin::into_balance(pool),
            start_time: current_time,
            end_time: current_time + (7 * 24 * 60 * 60 * 1000), // 7 gün
            is_active: true,
        };

        registry.total_weeks = registry.total_weeks + 1;
        registry.next_reset = current_time + (7 * 24 * 60 * 60 * 1000);

        event::emit(MiniHackCreated {
            week_number: registry.current_week,
            total_pool: pool_amount,
            challenges_count: len,
        });

        registry.current_week = registry.current_week + 1;
        transfer::share_object(mini_hack);
    }

    /// Mini hack challenge'ı çöz
    public entry fun solve_challenge(
        registry: &mut MiniHackRegistry,
        mini_hack: &mut MiniHack,
        challenge_index: u64,
        solution: vector<u8>, // Hash of solution
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let current_time = clock::timestamp_ms(clock);
        
        assert!(mini_hack.is_active, EMiniHackNotActive);
        assert!(current_time < mini_hack.end_time, EMiniHackNotActive);

        let challenge = vector::borrow_mut(&mut mini_hack.challenges, challenge_index);
        assert!(!challenge.is_claimed, EMiniHackAlreadyClaimed);
        
        // Solution hash kontrolü (basit - production'da daha güvenli olmalı)
        assert!(solution == challenge.solution_hash, EInvalidSolution);

        // Ödülü winner'a transfer et
        let reward_coin = coin::from_balance(
            balance::split(&mut mini_hack.pool_balance, challenge.reward),
            ctx
        );
        let reward_amount = coin::value(&reward_coin);
        
        transfer::public_transfer(reward_coin, tx_context::sender(ctx));

        // Challenge'ı işaretle
        challenge.winner = option::some(tx_context::sender(ctx));
        challenge.is_claimed = true;

        registry.total_distributed = registry.total_distributed + reward_amount;

        event::emit(MiniHackSolved {
            week_number: mini_hack.week_number,
            challenge_index,
            solver: tx_context::sender(ctx),
            reward: reward_amount,
        });

        // TODO: HackerPoints kontratına puan ekle
    }

    /// Haftalık reset (her Cuma)
    public entry fun check_weekly_reset(
        registry: &mut MiniHackRegistry,
        clock: &Clock,
        _ctx: &mut TxContext
    ) {
        let current_time = clock::timestamp_ms(clock);
        assert!(current_time >= registry.next_reset, ENotWeeklyReset);
        
        // Yeni hafta başlatıldı (create_weekly_mini_hack çağrılmalı)
        registry.next_reset = current_time + (7 * 24 * 60 * 60 * 1000);
    }

    // ============= View Functions =============
    
    public fun get_mini_hack_info(mini_hack: &MiniHack): (u64, String, u64, u64, bool) {
        (
            mini_hack.week_number,
            mini_hack.title,
            mini_hack.total_pool,
            vector::length(&mini_hack.challenges),
            mini_hack.is_active
        )
    }

    public fun get_challenge_count(mini_hack: &MiniHack): u64 {
        vector::length(&mini_hack.challenges)
    }

    public fun is_active(mini_hack: &MiniHack, clock: &Clock): bool {
        let current_time = clock::timestamp_ms(clock);
        mini_hack.is_active && current_time < mini_hack.end_time
    }
}
