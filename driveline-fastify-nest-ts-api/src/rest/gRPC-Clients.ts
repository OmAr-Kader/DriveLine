import * as user from 'src/common/dto/user.dto';
import * as auth from 'src/common/dto/auth.dto';
import * as course from 'src/common/dto/course.dto';
import * as fixService from 'src/common/dto/fixService.dto';
import * as shortVideo from 'src/common/dto/shortVideo.dto';
import * as aiMessage from 'src/common/dto/aiMessage.dto';
import * as aiSession from 'src/common/dto/aiSession.dto';
import * as common from 'src/common/dto/common.dto';
import { Observable } from 'rxjs';
import { GenerateContentRequest } from 'src/common/dto/gemini.dto';
import { CountResponse, GetAllCountsResponse } from 'src/common/dto/stats.dto';

export interface UserService {
  FindAll(data: user.GetAllUsersRequest): Observable<user.GetAllUsersResponse>;
  FindById(data: user.GetUserByIdRequest): Observable<user.GetUserByIdResponse>;
  Update(data: user.UpdateUserRequest): Observable<user.UpdateUserResponse>;
  Delete(data: common.IdRequest): Observable<common.MessageResponse>;
  GetProfileById(data: user.GetProfileByIdRequest): Observable<user.GetProfileByIdResponse>;
}

export interface ShortVideoService {
  Create(data: shortVideo.CreateShortVideoRequest): Observable<common.IdRequest>;
  GetByUserId(data: shortVideo.GetByUserIdRequest): Observable<shortVideo.GetByUserIdResponse>;
  GetById(data: common.IdUserIdRequest): Observable<shortVideo.GetByIdResponse>;
  FetchByTag(data: shortVideo.FetchByTagRequest): Observable<shortVideo.FetchByTagResponse>;
  FetchLatest(data: shortVideo.FetchLatestRequest): Observable<shortVideo.FetchLatestResponse>;
  IncrementViews(data: common.IdUserIdRequest): Observable<shortVideo.IncrementViewsResponse>;
  UpdateTags(data: shortVideo.UpdateTagsRequest): Observable<shortVideo.UpdateTagsResponse>;
  Delete(data: common.IdUserIdUndefinedRequest): Observable<common.MessageResponse>;
  GetAll(data: shortVideo.FetchAllRequest): Observable<shortVideo.FetchLatestResponse>;
}

export interface AiMessageGrpc {
  CreateMessage(data: aiMessage.CreateMessageRequest): Observable<aiMessage.GetAIMessageResponse>;
  GetMessage(data: common.IdUserIdRequest): Observable<aiMessage.GetAIMessageResponse>;
  GetMessagesBySession(data: aiMessage.GetMessagesBySessionRequest): Observable<aiMessage.GetAIMessagesBySessionResponse>;
  UpdateMessage(data: aiMessage.UpdateMessageRequest): Observable<aiMessage.GetAIMessageResponse>;
  DeleteMessage(data: aiMessage.DeleteMessageRequest): Observable<common.MessageResponse>;
  CreateMessageFromServer(data: aiMessage.CreateMessageFromServerRequest): Observable<aiMessage.GetAIMessageResponse>;
}

export interface AiSessionGrpc {
  CreateSessionAndAddFirstMessage(data: aiSession.CreateSessionAndFirstMessageRequest): Observable<aiSession.CreateSessionAndFirstMessageResponse>;
  CreateSession(data: aiSession.CreateSessionRequest): Observable<aiSession.AISessionResponse>;
  ListSessions(data: aiSession.ListSessionsRequest): Observable<aiSession.ListSessionsResponse>;
  UpdateSessionTitle(data: aiSession.UpdateSessionTitleRequest): Observable<aiSession.AISessionResponse>;
  DeleteSession(data: common.IdUserIdRequest): Observable<common.MessageResponse>;
}

export interface AuthGrpc {
  Register(data: Partial<auth.RegisterUser>): Observable<auth.RegisterResponse>;
  Login(data: auth.LoginUser): Observable<auth.LoginResponse>;
  ShakeHand(data: auth.ShakeHandRequest): Observable<auth.ShakeHandResponse>;
}

export interface GeminiGrpc {
  GenerateContent(data: GenerateContentRequest): Observable<common.DataObjectResponse>;
}

export interface CourseGrpc {
  Create(data: course.CreateCourseRequest): Observable<course.CreateCourseResponse>;
  Update(data: course.UpdateCourseRequest): Observable<course.CreateCourseResponse>;
  GetCourseById(data: common.IdUserIdRequest): Observable<common.DataObjectResponse>;
  GetCoursesByCourseAdminId(data: course.GetCoursesByCourseAdminIdRequest): Observable<common.DataObjectsResponse>;
  ListByTech(data: course.ListByTechRequest): Observable<course.GetCoursesResponse>;
  GetAllCourses(data: course.GetAllCoursesRequest): Observable<course.GetCoursesResponse>;
  Delete(data: common.IdRequest): Observable<common.MessageResponse>;
}

export interface FixServiceGrpc {
  Create(data: fixService.CreateFixServiceRequest): Observable<fixService.CreateFixServiceResponse>;
  Update(data: fixService.UpdateFixServiceRequest): Observable<fixService.CreateFixServiceResponse>;
  GetServiceById(data: common.IdUserIdRequest): Observable<common.DataObjectResponse>;
  GetServicesByServiceAdminId(data: fixService.GetServicesByServiceAdminIdRequest): Observable<common.DataObjectsResponse>;
  ListByTech(data: fixService.ListByTechRequest): Observable<fixService.GetServicesResponse>;
  GetAllServices(data: fixService.GetAllServicesRequest): Observable<fixService.GetServicesResponse>;
  Delete(data: common.IdRequest): Observable<common.MessageResponse>;
}

export interface StatsGrpc {
  CountUsers(empty: common.Empty): Observable<CountResponse>;
  CountFixServices(empty: common.Empty): Observable<CountResponse>;
  CountCourses(empty: common.Empty): Observable<CountResponse>;
  CountShortVideos(empty: common.Empty): Observable<CountResponse>;
  GetAllCounts(empty: common.Empty): Observable<GetAllCountsResponse>;
}
