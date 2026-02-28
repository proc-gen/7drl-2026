export const AiActionTypes = {
    Move: 'Move',
    AttackRanged: 'AttackRanged',
    Reload: 'Reload',
    AttackMelee: 'AttackMelee'
}

export type AiActionType = keyof typeof AiActionTypes