import type { UserRecord, UserRepository } from "@mml-bookmark/core/auth";
import type { EntityManager } from "@mikro-orm/postgresql";
import { User, type IUser } from "../../entities/auth/user.entity";

function toRecord(user: IUser): UserRecord {
  return { id: user.id, email: user.email, isAdmin: user.isAdmin, suspendedAt: user.suspendedAt ?? null, createdAt: user.createdAt };
}

export class MikroUserRepository implements UserRepository {
  private readonly em: EntityManager;

  constructor({ em }: { em: EntityManager }) {
    this.em = em;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const user = await this.em.findOne(User, { id });
    return user ? toRecord(user) : null;
  }

  async insertIfAbsent({ id, email }: { id: string; email: string }): Promise<void> {
    await this.em.createQueryBuilder(User).insert({ id, email }).onConflict("id").ignore().execute();
  }

  async updateEmail(id: string, email: string): Promise<void> {
    await this.em.nativeUpdate(User, { id }, { email });
  }
}
