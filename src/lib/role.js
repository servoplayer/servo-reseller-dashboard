// The login response's role is persisted as an opaque flag in localStorage
// (unchanged from the original implementation). A full Reseller's flag ends
// with "aC9R"; sub-resellers get a different suffix and cannot manage
// sub-resellers of their own.
//
// The flag only chooses which menu to show. Every permission is enforced by
// the API, so editing it in the browser unlocks nothing.
const RESELLER_FLAG = '7e#Q4xF@9zG3!rHgTq6vB2$Lp8eN1@wJ5kX$z9P!dT9#nC1jW4yM^fB7Q2&aC9R'
const SUB_RESELLER_FLAG = '7e#Q4xF@9zG3!rHgTq6vB2$Lp8eN1@wJ5kX$z9P!dT9#nC1jW4yM^fB7Q2&sC8aR'
const DISTRIBUTOR_FLAG = '7e#Q4xF@9zG3!rHgTq6vB2$Lp8eN1@wJ5kX$z9P!dT9#nC1jW4yM^fB7Q2&dM7Q'

export function saveRole(role) {
  if (role == 'Reseller') localStorage.setItem('authorization', RESELLER_FLAG)
  else if (role == 'subReseller') localStorage.setItem('authorization', SUB_RESELLER_FLAG)
  else if (role == 'distributorManager') localStorage.setItem('authorization', DISTRIBUTOR_FLAG)
}

export const isFullReseller = () => Boolean(localStorage.getItem('authorization')?.endsWith('aC9R'))

/** Restricted staff account that recharges resellers; it has no customers of its own. */
export const isDistributorManager = () => Boolean(localStorage.getItem('authorization')?.endsWith('dM7Q'))

export const roleLabel = () =>
  isDistributorManager() ? 'Distributor manager' : isFullReseller() ? 'Reseller' : 'Sub-reseller'
