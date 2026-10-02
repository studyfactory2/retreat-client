export interface GuestStayVehicleScope {
  stayId: string;
  propertyId: string;
}

export interface GuestStayVehicleDto {
  stayId: string;
  property: { id: string; name: string; region: string | null };
  enabled: boolean;
  version: number;
  plateNumber: string | null;
  needsConfirmation: boolean;
  updatedAt: string | null;
}

export interface SaveGuestStayVehicleInput {
  expectedVersion: number;
  plateNumber: string | null;
}
