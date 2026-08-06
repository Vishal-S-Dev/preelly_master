import { BankAccountDTO, SavedCardDTO } from '../../../../../data/api/UserApi';
import { BankAccount, SavedCard } from '../../../../../types/profileEdit.types';

export const mapBankAccountDto = (dto: BankAccountDTO, index: number): BankAccount => ({
  id: dto._id ?? dto.id ?? `bank_${index}`,
  bankName: dto.bankName ?? '',
  accountNumber: dto.accountNumber ?? '',
  iban: dto.iban || undefined,
  swift: dto.swift || undefined,
  branchName: dto.branchName || undefined,
  isPrimary: Boolean(dto.isPrimary),
});

export const mapSavedCardDto = (dto: SavedCardDTO, index: number): SavedCard => ({
  id: dto._id ?? dto.id ?? `card_${index}`,
  brand: dto.brand || 'Card',
  last4: dto.last4 ?? '',
  expiry: dto.expiry || undefined,
  holderName: dto.holderName || undefined,
  nickname: dto.nickname || undefined,
  isPrimary: Boolean(dto.isPrimary),
});
