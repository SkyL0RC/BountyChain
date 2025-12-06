module bountychain::bounty_manager {
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::clock::{Self, Clock};
    use sui::event;
    use std::string::{Self, String};

    // ============= Errors =============
    const EInvalidDeadline: u64 = 0;
    const EInvalidReward: u64 = 1;
    const EBountyExpired: u64 = 2;
    const EBountyNotExpired: u64 = 3;
    const EDuplicateSubmission: u64 = 4;
    const ENotBountyOwner: u64 = 5;
    const EBountyAlreadyClaimed: u64 = 6;
    const ENotValidator: u64 = 7;
    const EInvalidSubmissionIndex: u64 = 8;
    const ESubmissionAlreadyReviewed: u64 = 9;

    // ============= Structs =============
    
    /// Review mode seçimi
    public struct ReviewMode has store, drop, copy {
        use_platform_review: bool, // true = Platform kontrol eder (%5 fee)
        review_timeout_days: u64,   // Owner bu sürede kontrol etmezse platform devreye girer (%10 fee)
    }
    
    /// Submission status
    public struct SubmissionStatus has store, drop, copy {
        is_reviewed: bool,
        is_approved: bool,
        reviewed_by: Option<address>,
        reviewed_at: u64,
        review_notes: String,
    }
    
    /// Ana bounty nesnesi - shared object olarak oluşturulur
    public struct Bounty has key, store {
        id: UID,
        title: String,
        description: String,
        scope: String,
        reward_amount: u64,
        reward_balance: Balance<SUI>,
        creator: address,
        deadline: u64, // Unix timestamp (ms)
        created_at: u64,
        
        // Review configuration
        review_mode: ReviewMode,
        
        // Submission tracking
        submissions: vector<Submission>,
        submission_hashes: vector<vector<u8>>, // Duplicate check için
        submission_statuses: vector<SubmissionStatus>,
        
        // Status
        is_claimed: bool,
        winner: Option<address>,
        
        // Project metadata
        project_name: String,
        github_url: String,
        website_url: String,
        
        // Severity rewards (Critical/High/Medium/Low)
        critical_reward: u64,
        high_reward: u64,
        medium_reward: u64,
        low_reward: u64,
    }

    /// Her submission için kayıt
    public struct Submission has store, drop, copy {
        submitter: address,
        walrus_blob_id: vector<u8>, // Walrus blob hash
        seal_encrypted_data: vector<u8>, // Seal encrypted metadata
        submitted_at: u64,
        severity: u8, // 0=Low, 1=Medium, 2=High, 3=Critical
    }

    /// Global bounty registry - shared object
    public struct BountyRegistry has key {
        id: UID,
        active_bounties: vector<ID>,
        total_bounties: u64,
        total_tvl: u64,
        total_paid: u64,
        platform_validators: vector<address>, // Platform validator'lar
        platform_fee_balance: Balance<SUI>,   // Toplanan komisyonlar
    }

    // ============= Events =============
    
    public struct BountyCreated has copy, drop {
        bounty_id: ID,
        creator: address,
        reward_amount: u64,
        deadline: u64,
    }

    public struct SubmissionReceived has copy, drop {
        bounty_id: ID,
        submitter: address,
        walrus_blob_id: vector<u8>,
        submitted_at: u64,
    }

    public struct BountyClaimed has copy, drop {
        bounty_id: ID,
        winner: address,
        reward_amount: u64,
    }

    public struct BountyCancelled has copy, drop {
        bounty_id: ID,
        refunded_amount: u64,
    }
    
    public struct SubmissionReviewed has copy, drop {
        bounty_id: ID,
        submission_index: u64,
        approved: bool,
        reviewer: address,
        platform_fee: u64,
    }

    // ============= Init =============
    
    fun init(ctx: &mut TxContext) {
        let registry = BountyRegistry {
            id: object::new(ctx),
            active_bounties: vector::empty(),
            total_bounties: 0,
            total_tvl: 0,
            total_paid: 0,
            platform_validators: vector::empty(),
            platform_fee_balance: balance::zero(),
        };
        transfer::share_object(registry);
    }

    // ============= Public Functions =============
    
    /// Yeni bounty oluştur
    public fun create_bounty(
        registry: &mut BountyRegistry,
        title: vector<u8>,
        description: vector<u8>,
        scope: vector<u8>,
        project_name: vector<u8>,
        github_url: vector<u8>,
        website_url: vector<u8>,
        reward: Coin<SUI>,
        critical_reward: u64,
        high_reward: u64,
        medium_reward: u64,
        low_reward: u64,
        deadline_days: u64,
        use_platform_review: bool,      // Yeni: Platform kontrolü istiyor mu?
        review_timeout_days: u64,       // Yeni: Owner kaç gün içinde kontrol etmeli?
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let reward_amount = coin::value(&reward);
        assert!(reward_amount > 0, EInvalidReward);
        assert!(deadline_days > 0 && deadline_days <= 90, EInvalidDeadline);
        assert!(review_timeout_days >= 1 && review_timeout_days <= 30, EInvalidDeadline);

        let current_time = clock::timestamp_ms(clock);
        let deadline = current_time + (deadline_days * 24 * 60 * 60 * 1000);

        let bounty_id = object::new(ctx);
        let bounty_id_copy = object::uid_to_inner(&bounty_id);
        
        let review_mode = ReviewMode {
            use_platform_review,
            review_timeout_days,
        };

        let bounty = Bounty {
            id: bounty_id,
            title: string::utf8(title),
            description: string::utf8(description),
            scope: string::utf8(scope),
            reward_amount,
            reward_balance: coin::into_balance(reward),
            creator: tx_context::sender(ctx),
            deadline,
            created_at: current_time,
            review_mode,
            submissions: vector::empty(),
            submission_hashes: vector::empty(),
            submission_statuses: vector::empty(),
            is_claimed: false,
            winner: option::none(),
            project_name: string::utf8(project_name),
            github_url: string::utf8(github_url),
            website_url: string::utf8(website_url),
            critical_reward,
            high_reward,
            medium_reward,
            low_reward,
        };

        // Registry güncelle
        vector::push_back(&mut registry.active_bounties, bounty_id_copy);
        registry.total_bounties = registry.total_bounties + 1;
        registry.total_tvl = registry.total_tvl + reward_amount;

        event::emit(BountyCreated {
            bounty_id: bounty_id_copy,
            creator: tx_context::sender(ctx),
            reward_amount,
            deadline,
        });

        transfer::share_object(bounty);
    }

    /// PoC submit et (Walrus + Seal ile)
    public fun submit_poc(
        bounty: &mut Bounty,
        walrus_blob_id: vector<u8>,
        seal_encrypted_data: vector<u8>,
        severity: u8, // 0=Low, 1=Medium, 2=High, 3=Critical
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let current_time = clock::timestamp_ms(clock);
        
        // Deadline kontrolü
        assert!(current_time < bounty.deadline, EBountyExpired);
        assert!(!bounty.is_claimed, EBountyAlreadyClaimed);
        
        // Duplicate hash kontrolü
        let mut i = 0;
        let len = vector::length(&bounty.submission_hashes);
        while (i < len) {
            let existing_hash = vector::borrow(&bounty.submission_hashes, i);
            assert!(existing_hash != &walrus_blob_id, EDuplicateSubmission);
            i = i + 1;
        };

        let submission = Submission {
            submitter: tx_context::sender(ctx),
            walrus_blob_id,
            seal_encrypted_data,
            submitted_at: current_time,
            severity,
        };
        
        let status = SubmissionStatus {
            is_reviewed: false,
            is_approved: false,
            reviewed_by: option::none(),
            reviewed_at: 0,
            review_notes: string::utf8(b""),
        };

        vector::push_back(&mut bounty.submissions, submission);
        vector::push_back(&mut bounty.submission_hashes, walrus_blob_id);
        vector::push_back(&mut bounty.submission_statuses, status);

        event::emit(SubmissionReceived {
            bounty_id: object::uid_to_inner(&bounty.id),
            submitter: tx_context::sender(ctx),
            walrus_blob_id,
            submitted_at: current_time,
        });
    }
    
    /// Owner veya Platform tarafından submission review
    public fun review_submission(
        registry: &mut BountyRegistry,
        bounty: &mut Bounty,
        submission_index: u64,
        approve: bool,
        review_notes: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let current_time = clock::timestamp_ms(clock);
        let sender = tx_context::sender(ctx);
        
        assert!(!bounty.is_claimed, EBountyAlreadyClaimed);
        assert!(submission_index < vector::length(&bounty.submissions), EInvalidSubmissionIndex);
        
        let status = vector::borrow_mut(&mut bounty.submission_statuses, submission_index);
        assert!(!status.is_reviewed, ESubmissionAlreadyReviewed);
        
        let is_owner = sender == bounty.creator;
        let is_validator = vector::contains(&registry.platform_validators, &sender);
        
        // Owner her zaman review yapabilir
        // Platform validator sadece:
        // 1. Platform review mode aktifse VEYA
        // 2. Timeout süresi dolmuşsa
        let can_review = if (is_owner) {
            true
        } else if (is_validator) {
            let submission = vector::borrow(&bounty.submissions, submission_index);
            let time_since_submission = current_time - submission.submitted_at;
            let timeout_ms = bounty.review_mode.review_timeout_days * 24 * 60 * 60 * 1000;
            
            bounty.review_mode.use_platform_review || time_since_submission >= timeout_ms
        } else {
            false
        };
        
        assert!(can_review, ENotValidator);
        
        // Calculate fee
        let platform_fee = if (is_owner) {
            // Owner review: %3 fee
            bounty.reward_amount * 3 / 100
        } else {
            // Platform review: %5 veya %10 (timeout'tan dolayı)
            let submission = vector::borrow(&bounty.submissions, submission_index);
            let time_since_submission = current_time - submission.submitted_at;
            let timeout_ms = bounty.review_mode.review_timeout_days * 24 * 60 * 60 * 1000;
            
            if (time_since_submission >= timeout_ms) {
                // Timeout: %10 fee
                bounty.reward_amount * 10 / 100
            } else {
                // Normal platform review: %5 fee
                bounty.reward_amount * 5 / 100
            }
        };
        
        // Update status
        status.is_reviewed = true;
        status.is_approved = approve;
        status.reviewed_by = option::some(sender);
        status.reviewed_at = current_time;
        status.review_notes = string::utf8(review_notes);
        
        event::emit(SubmissionReviewed {
            bounty_id: object::uid_to_inner(&bounty.id),
            submission_index,
            approved: approve,
            reviewer: sender,
            platform_fee,
        });
        
        // Eğer approved ise ödemeyi yap
        if (approve) {
            let submission = vector::borrow(&bounty.submissions, submission_index);
            let winner_address = submission.submitter;
            
            // Platform fee'yi al
            if (platform_fee > 0) {
                let fee_balance = balance::split(&mut bounty.reward_balance, platform_fee);
                balance::join(&mut registry.platform_fee_balance, fee_balance);
            };
            
            // Kalan ödemeyi winner'a gönder
            let reward_coin = coin::from_balance(
                balance::withdraw_all(&mut bounty.reward_balance),
                ctx
            );
            let final_reward = coin::value(&reward_coin);
            
            transfer::public_transfer(reward_coin, winner_address);
            
            bounty.is_claimed = true;
            bounty.winner = option::some(winner_address);
            
            registry.total_paid = registry.total_paid + final_reward + platform_fee;
            registry.total_tvl = registry.total_tvl - (final_reward + platform_fee);
            
            event::emit(BountyClaimed {
                bounty_id: object::uid_to_inner(&bounty.id),
                winner: winner_address,
                reward_amount: final_reward,
            });
        };
    }

    /// ESKİ claim_bounty - Artık kullanılmıyor ama backward compatibility için bırakıldı
    public fun claim_bounty(
        registry: &mut BountyRegistry,
        bounty: &mut Bounty,
        submission_index: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Simply call review_submission with approve=true
        review_submission(
            registry,
            bounty,
            submission_index,
            true,
            b"Approved by owner",
            clock,
            ctx
        );
    }

    /// Platform validator ekle (sadece init sırasında veya admin)
    public fun add_platform_validator(
        registry: &mut BountyRegistry,
        validator: address,
        _ctx: &mut TxContext
    ) {
        // TODO: Add admin check
        vector::push_back(&mut registry.platform_validators, validator);
    }

    /// Bounty'yi iptal et ve parayı geri al (deadline geçmeden)
    public fun cancel_bounty(
        registry: &mut BountyRegistry,
        bounty: &mut Bounty,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let current_time = clock::timestamp_ms(clock);
        
        assert!(tx_context::sender(ctx) == bounty.creator, ENotBountyOwner);
        assert!(current_time < bounty.deadline, EBountyExpired);
        assert!(!bounty.is_claimed, EBountyAlreadyClaimed);

        let refund_coin = coin::from_balance(
            balance::withdraw_all(&mut bounty.reward_balance),
            ctx
        );
        let refund_amount = coin::value(&refund_coin);

        transfer::public_transfer(refund_coin, bounty.creator);

        bounty.is_claimed = true;
        registry.total_tvl = registry.total_tvl - refund_amount;

        event::emit(BountyCancelled {
            bounty_id: object::uid_to_inner(&bounty.id),
            refunded_amount: refund_amount,
        });
    }

    // ============= View Functions =============
    
    public fun get_bounty_info(bounty: &Bounty): (String, u64, u64, bool, u64) {
        (
            bounty.title,
            bounty.reward_amount,
            bounty.deadline,
            bounty.is_claimed,
            vector::length(&bounty.submissions)
        )
    }

    public fun get_submission_count(bounty: &Bounty): u64 {
        vector::length(&bounty.submissions)
    }

    public fun is_expired(bounty: &Bounty, clock: &Clock): bool {
        clock::timestamp_ms(clock) >= bounty.deadline
    }
    
    public fun get_submission_status(bounty: &Bounty, index: u64): (bool, bool, u64) {
        let status = vector::borrow(&bounty.submission_statuses, index);
        (status.is_reviewed, status.is_approved, status.reviewed_at)
    }
    
    public fun is_platform_review_enabled(bounty: &Bounty): bool {
        bounty.review_mode.use_platform_review
    }
    
    public fun get_review_timeout_days(bounty: &Bounty): u64 {
        bounty.review_mode.review_timeout_days
    }
}
