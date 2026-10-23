import type { UserRecord, UserRepository } from "./user-repository.port";

export class UserService {
  private readonly userRepository: UserRepository;

  constructor({ userRepository }: { userRepository: UserRepository }) {
    this.userRepository = userRepository;
  }

  /**
   * Returns our user for a verified Supabase identity, creating the row on first sight and
   * copying a changed email (D47). There is no sign-up hook into Supabase; this is the only path.
   */
  async resolve(identity: { id: string; email: string }): Promise<UserRecord> {
    const existing = await this.userRepository.findById(identity.id);
    if (existing) {
      if (existing.email === identity.email) return existing;
      await this.userRepository.updateEmail(identity.id, identity.email);
      return { ...existing, email: identity.email };
    }
    await this.userRepository.insertIfAbsent(identity);
    const created = await this.userRepository.findById(identity.id);
    if (!created) throw new Error(`User ${identity.id} is missing right after insert`);
    return created;
  }
}
