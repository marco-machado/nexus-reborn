// Deploy button copy for a refused canDeploy gate. Presentation only
// (ADR-0019): Roster owns the rule, Interface says why.
import type { DeployGate } from '../game/deployGate'

/** [aria/label line, button line] for a refused gate, or null when Deploy is allowed. */
export function deployRefusalCopy(gate: DeployGate): readonly [string, string] | null {
  switch (gate.reason) {
    case null:
      return null
    case 'no-contract':
      return ['NO CONTRACT SELECTED', 'SELECT A CONTRACT ON THE WORLD NETWORK']
    case 'none-assigned':
      return ['NO OPERATIVES ASSIGNED', 'ASSIGN AT LEAST ONE READY OPERATIVE']
    case 'not-ready':
      return ['INJURED OPERATIVE ASSIGNED', 'REMOVE INJURED OPERATIVES BEFORE DEPLOYMENT']
    case 'over-mass':
      return [
        gate.overKg.toFixed(1) + ' KG OVER THE MASS LIMIT',
        'OFFLOAD ' + gate.overKg.toFixed(1) + ' KG BEFORE DEPLOYMENT',
      ]
  }
}
