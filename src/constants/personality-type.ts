export const PersonalityTypes = {
    Melee: 'Melee',
    Ranged: 'Ranged',
    Thief: 'Thief',
    Clean: 'Clean',
    SentryBoss: 'SentryBoss',
    CyborgBoss: 'CyborgBoss'
}

export type PersonalityType = keyof typeof PersonalityTypes