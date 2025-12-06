module bountychain::hacker_points {
    use sui::table::{Self, Table};
    use sui::event;

    // ============= Errors =============
    const ENotAuthorized: u64 = 0;

    // ============= Structs =============
    
    /// Global leaderboard - shared object
    public struct Leaderboard has key {
        id: UID,
        points: Table<address, u64>, // address -> total points
        total_hackers: u64,
        admin: address, // Sadece bounty_manager kontratı puan ekleyebilir
    }

    /// Point award seviyeleri
    public struct PointRewards has drop {
        critical: u64,  // 50
        high: u64,      // 30
        medium: u64,    // 15
        low: u64,       // 5
        mini_hack: u64, // 10
    }

    // ============= Events =============
    
    public struct PointsAwarded has copy, drop {
        hacker: address,
        points: u64,
        new_total: u64,
        reason: u8, // 0=Low, 1=Medium, 2=High, 3=Critical, 4=MiniHack
    }

    // ============= Init =============
    
    fun init(ctx: &mut TxContext) {
        let leaderboard = Leaderboard {
            id: object::new(ctx),
            points: table::new(ctx),
            total_hackers: 0,
            admin: tx_context::sender(ctx),
        };
        transfer::share_object(leaderboard);
    }

    // ============= Public Functions =============
    
    /// Puan ekle (sadece authorized kontratlar)
    public fun add_points(
        leaderboard: &mut Leaderboard,
        hacker: address,
        points: u64,
        reason: u8,
        _ctx: &mut TxContext
    ) {
        // TODO: Move'da caller kontrat kontrolü
        // assert!(tx_context::sender(ctx) == leaderboard.admin, ENotAuthorized);

        let current_points = if (table::contains(&leaderboard.points, hacker)) {
            *table::borrow(&leaderboard.points, hacker)
        } else {
            leaderboard.total_hackers = leaderboard.total_hackers + 1;
            0
        };

        let new_total = current_points + points;
        
        if (table::contains(&leaderboard.points, hacker)) {
            *table::borrow_mut(&mut leaderboard.points, hacker) = new_total;
        } else {
            table::add(&mut leaderboard.points, hacker, new_total);
        };

        event::emit(PointsAwarded {
            hacker,
            points,
            new_total,
            reason,
        });
    }

    /// Severity'ye göre puan ekle
    public entry fun award_points_for_severity(
        leaderboard: &mut Leaderboard,
        hacker: address,
        severity: u8, // 0=Low, 1=Medium, 2=High, 3=Critical
        ctx: &mut TxContext
    ) {
        let points = if (severity == 3) {
            50 // Critical
        } else if (severity == 2) {
            30 // High
        } else if (severity == 1) {
            15 // Medium
        } else {
            5 // Low
        };

        add_points(leaderboard, hacker, points, severity, ctx);
    }

    /// Mini hack kazananına puan ekle
    public entry fun award_mini_hack_points(
        leaderboard: &mut Leaderboard,
        hacker: address,
        ctx: &mut TxContext
    ) {
        add_points(leaderboard, hacker, 10, 4, ctx); // 4 = MiniHack
    }

    // ============= View Functions =============
    
    public fun get_points(leaderboard: &Leaderboard, hacker: address): u64 {
        if (table::contains(&leaderboard.points, hacker)) {
            *table::borrow(&leaderboard.points, hacker)
        } else {
            0
        }
    }

    public fun get_total_hackers(leaderboard: &Leaderboard): u64 {
        leaderboard.total_hackers
    }

    public fun get_point_rewards(): PointRewards {
        PointRewards {
            critical: 50,
            high: 30,
            medium: 15,
            low: 5,
            mini_hack: 10,
        }
    }
}
