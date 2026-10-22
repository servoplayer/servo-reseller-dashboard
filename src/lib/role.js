// The login response's role is persisted as an opaque flag in localStorage
// (unchanged from the original implementation). A full Reseller's flag ends
// with "aC9R"; sub-resellers get a different suffix and cannot manage
// sub-resellers of their own.
const RESELLER_FLAG = '7e#Q4xF@9zG3!rHgTq6vB2$Lp8eN1@wJ5kX$z9P!dT9#nC1jW4yM^fB7Q2&aC9R'
const SUB_RESELLER_FLAG = '7e#Q4xF@9zG3!rHgTq6vB2$Lp8eN1@wJ5kX$z9P!dT9#nC1jW4yM^fB7Q2&sC8aR'

export function saveRole(role) {
  if (role == 'Reseller') localStorage.setItem('authorization', RESELLER_FLAG)
  else if (role == 'subReseller') localStorage.setItem('authorization', SUB_RESELLER_FLAG)
}

export const isFullReseller = () => Boolean(localStorage.getItem('authorization')?.endsWith('aC9R'))

export const roleLabel = () => (isFullReseller() ? 'Reseller' : 'Sub-reseller')
