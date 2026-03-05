export const TriggerTypes = {
  L1StartLevel: 'L1StartLevel',
  L1TriggerSecurity: 'L1TriggerSecurity',
  L1SpawnCyborg: 'L1SpawnCyborg',
  L1SeeCyborg: 'L1SeeCyborg',
  L2SpawnPickpocket: 'L2SpawnPickpocket',
  L2SeePickpocket: 'L2SeePickpocket',
  L3SeeExplodingSpider: 'L3SeeExplodingSpider',
  L4SpawnSpecialCyborgs: 'L4SpawnSpecialCyborgs',
  L4SeeSpecialCyborgs: 'L4SeeSpecialCyborgs',
  L4EndLevel: 'L4EndLevel',
  L5StartLevel: 'L5StartLevel',
  L6SeeSentryBoss: 'L6SeeSentryBoss',
  L6KilledSentryBoss: 'L6KilledSentryBoss',
  L8SeeBossCyborg: 'L8SeeBossCyborg',
  L8KilledBossCyborg: 'L8KilledBossCyborg',
}

export type TriggerType = keyof typeof TriggerTypes
