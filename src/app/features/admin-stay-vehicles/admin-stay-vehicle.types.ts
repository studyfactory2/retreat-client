export interface AdminStayVehicleDto {
  stay: {
    id: string;
    guestName: string;
    checkInAt: string;
    checkOutAt: string;
    status: 'ACTIVE' | 'CANCELLED';
    currentRevision: number;
    property: {
      id: string;
      name: string;
      region: string | null;
      isActive: boolean;
      vehicleRegistrationEnabled: boolean;
    };
  };
  vehicle: {
    plateNumber: string | null;
    version: number;
    stayRevision: number;
    createdAt: string;
    updatedAt: string;
  } | null;
  needsReview: boolean;
}
