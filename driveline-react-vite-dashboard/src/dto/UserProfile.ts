import type { FullUser } from './User';
import type { FixService } from './FixService';
import type { Course } from './Course';
import type { ShortVideo } from './ShortVideo';


export class GetProfileByIdResponse {
  profile?: UserProfile;
}

export interface UserProfile {
  user: FullUser | null;
  services: FixService[];
  courses: Course[];
  shorts: ShortVideo[];
}
