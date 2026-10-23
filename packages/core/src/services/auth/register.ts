import { asClass } from "awilix";
import type { AppContainer } from "../../container";
import type { UserRepository } from "./user-repository.port";
import { UserService } from "./user.service";

declare module "../../container" {
  interface Cradle {
    /** Port; `registerDb` in `@mml-bookmark/db` binds the implementation. */
    userRepository: UserRepository;
    userService: UserService;
  }
}

/** Scoped: the service uses the request's repository and, through it, the request `em`. */
export function registerAuth(container: AppContainer): void {
  container.register({ userService: asClass(UserService).scoped() });
}
