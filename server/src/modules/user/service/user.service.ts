import { User, UserRole, VerificationStatus, EmergencyContact } from '../../../models/index.js';

export class UserService {

  async getProfile(userId: string) {
    const user = await User.findById(userId).select('-password');
    if (!user) throw new Error('User not found');
    return user;
  }

  async updateProfile(userId: string, data: Partial<{
    name: string;
    phone: string;
  }>) {
    const user = await User.findByIdAndUpdate(userId, data, { new: true }).select('-password');
    if (!user) throw new Error('User not found');
    return { message: 'Profile updated', user };
  }

  // Upload ID proof for identity verification
  async uploadIDProof(userId: string, idProofUrl: string) {
    const user = await User.findByIdAndUpdate(
      userId,
      {
        idProofUrl,
        idVerificationStatus: VerificationStatus.PENDING,
      },
      { new: true }
    ).select('-password');

    if (!user) throw new Error('User not found');
    return { message: 'ID proof uploaded. Awaiting verification.', user };
  }

  // SUPER_ADMIN approves/rejects ID
  async reviewIDVerification(userId: string, status: VerificationStatus) {
    const user = await User.findByIdAndUpdate(
      userId,
      { idVerificationStatus: status },
      { new: true }
    ).select('-password');

    if (!user) throw new Error('User not found');
    return { message: `ID verification ${status.toLowerCase()}`, user };
  }

  // SUPER_ADMIN — get all pending ID verifications
  async getPendingVerifications() {
    return await User.find({
      role: UserRole.FEMALE_USER,
      idVerificationStatus: VerificationStatus.PENDING,
      idProofUrl: { $exists: true, $ne: null },
    }).select('-password');
  }

  // Emergency contacts
  async addEmergencyContact(userId: string, data: {
    name: string;
    phone: string;
    relation: string;
  }) {
    const count = await EmergencyContact.countDocuments({ userId });
    if (count >= 5) throw new Error('Maximum 5 emergency contacts allowed');

    const contact = await EmergencyContact.create({ userId, ...data });
    return { message: 'Emergency contact added', contact };
  }

  async getEmergencyContacts(userId: string) {
    return await EmergencyContact.find({ userId });
  }

  async updateEmergencyContact(contactId: string, userId: string, data: Partial<{
    name: string;
    phone: string;
    relation: string;
  }>) {
    const contact = await EmergencyContact.findOneAndUpdate(
      { _id: contactId, userId },
      data,
      { new: true }
    );
    if (!contact) throw new Error('Contact not found');
    return { message: 'Contact updated', contact };
  }

  async deleteEmergencyContact(contactId: string, userId: string) {
    const contact = await EmergencyContact.findOneAndDelete({ _id: contactId, userId });
    if (!contact) throw new Error('Contact not found');
    return { message: 'Contact deleted' };
  }
}