export const AiActionTypes = {
    Move: 'Move',
    AttackRanged: 'AttackRanged',
    Reload: 'Reload',
    AttackMelee: 'AttackMelee',
    Steal: 'Steal'
}

export type AiActionType = keyof typeof AiActionTypes