// Sui blockchain helper functions

import { SuiClient } from '@mysten/sui/client';

/**
 * Get bounties from BountyRegistry
 */
export async function getBounties(suiClient, registryId) {
  try {
    const object = await suiClient.getObject({
      id: registryId,
      options: { showContent: true }
    });

    if (object.data?.content?.dataType === 'moveObject') {
      const fields = object.data.content.fields;
      return {
        activeBounties: fields.active_bounties || [],
        totalBounties: parseInt(fields.total_bounties || 0),
        totalTvl: parseInt(fields.total_tvl || 0),
        totalPaid: parseInt(fields.total_paid || 0),
      };
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch bounties:', error);
    return null;
  }
}

/**
 * Get single bounty details
 */
export async function getBountyDetails(suiClient, bountyId) {
  try {
    const object = await suiClient.getObject({
      id: bountyId,
      options: { showContent: true }
    });

    if (object.data?.content?.dataType === 'moveObject') {
      const fields = object.data.content.fields;
      return {
        id: bountyId,
        title: fields.title,
        description: fields.description,
        scope: fields.scope,
        rewardAmount: parseInt(fields.reward_amount),
        creator: fields.creator,
        deadline: parseInt(fields.deadline),
        createdAt: parseInt(fields.created_at),
        isClaimed: fields.is_claimed,
        winner: fields.winner,
        projectName: fields.project_name,
        githubUrl: fields.github_url,
        websiteUrl: fields.website_url,
        criticalReward: parseInt(fields.critical_reward),
        highReward: parseInt(fields.high_reward),
        mediumReward: parseInt(fields.medium_reward),
        lowReward: parseInt(fields.low_reward),
        submissionCount: fields.submissions?.length || 0,
      };
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch bounty details:', error);
    return null;
  }
}

/**
 * Get leaderboard data
 */
export async function getLeaderboard(suiClient, leaderboardId) {
  try {
    const object = await suiClient.getObject({
      id: leaderboardId,
      options: { showContent: true }
    });

    if (object.data?.content?.dataType === 'moveObject') {
      const fields = object.data.content.fields;
      
      // Points table'dan tüm hackerları al
      const pointsTable = fields.points?.fields?.id?.id;
      if (!pointsTable) {
        return {
          totalHackers: 0,
          hackers: []
        };
      }

      // Dynamic field'ları oku (hacker address -> points mapping)
      const dynamicFields = await suiClient.getDynamicFields({
        parentId: pointsTable
      });

      const hackers = await Promise.all(
        dynamicFields.data.map(async (field) => {
          const fieldData = await suiClient.getDynamicFieldObject({
            parentId: pointsTable,
            name: field.name
          });

          return {
            address: field.name.value,
            points: parseInt(fieldData.data?.content?.fields?.value || 0)
          };
        })
      );

      // Puana göre sırala
      hackers.sort((a, b) => b.points - a.points);

      return {
        totalHackers: parseInt(fields.total_hackers || 0),
        hackers
      };
    }
    return { totalHackers: 0, hackers: [] };
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    return { totalHackers: 0, hackers: [] };
  }
}

/**
 * Get hacker points
 */
export async function getHackerPoints(suiClient, leaderboardId, hackerAddress) {
  try {
    const leaderboard = await getLeaderboard(suiClient, leaderboardId);
    const hacker = leaderboard.hackers.find(h => h.address === hackerAddress);
    return hacker?.points || 0;
  } catch (error) {
    console.error('Failed to fetch hacker points:', error);
    return 0;
  }
}

/**
 * Convert MIST to SUI
 */
export function mistToSui(mist) {
  return (parseInt(mist) / 1_000_000_000).toFixed(2);
}

/**
 * Convert SUI to MIST
 */
export function suiToMist(sui) {
  return Math.floor(parseFloat(sui) * 1_000_000_000);
}

/**
 * Format timestamp to readable date
 */
export function formatTimestamp(timestamp) {
  const date = new Date(parseInt(timestamp));
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Check if bounty is expired
 */
export function isBountyExpired(deadline) {
  return Date.now() > parseInt(deadline);
}

/**
 * Get time remaining
 */
export function getTimeRemaining(deadline) {
  const now = Date.now();
  const end = parseInt(deadline);
  const diff = end - now;

  if (diff <= 0) return 'Expired';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

export default {
  getBounties,
  getBountyDetails,
  getLeaderboard,
  getHackerPoints,
  mistToSui,
  suiToMist,
  formatTimestamp,
  isBountyExpired,
  getTimeRemaining,
};
