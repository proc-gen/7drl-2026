export const TriggerTypes = {
    L1StartLevel: 'L1StartLevel',
    L1TriggerSecurity: 'L1TriggerSecurity',
    L1SpawnCyborg: 'L1SpawnCyborg',
    L1SeeCyborg: 'L1SeeCyborg',
    L2SpawnPickpocket: 'L2SpawnPickpocket',
    L2SeePickpocket: 'L2SeePickpocket',
    L4SpawnSpecialCyborgs: 'L4SpawnSpecialCyborgs',
    L4EndLevel: 'L4EndLevel',
    L5StartLevel: 'L5StartLevel',
    L6SeeSentryBoss: 'L6SeeSentryBoss',
    L8SeeBossCyborg: 'L8SeeBossCyborg',
}

export type TriggerType = keyof typeof TriggerTypes