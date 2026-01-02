//
//  AuthRepoImp.swift
//  DriveLine
//
//  Created by OmAr Kader on 08/11/2025.
//

import Foundation
import SwiftUISturdy

final class AuthRepoImp : AuthRepo {
    
    let appSessions: AppURLSessions
    let secureSession: SecureSessionManager

    init(appSessions: AppURLSessions, secureSession: SecureSessionManager) {
        self.appSessions = appSessions
        self.secureSession = secureSession
    }
    
    @BackgroundActor
    func shakeHand(userId: String, invoke: @escaping @BackgroundActor (ShakeHandsResponse) async -> Void, failed: @BackgroundActor (String) -> Void) async {
        guard let url = URL(string: SecureConst.BASE_URL + Endpoint.SHAKE_HAND) else {
            LogKit.print("login Invalid URL"); failed("Failed")
            return
        }
        do {
            let publicKey = try await self.secureSession.getOurPublicKey()
            let response: ShakeHandsResponse = try await url.createPOSTRequest(body: ShakeHandsRequest(publicKey: publicKey)).addAuthorizationHeader(userId: userId).performRequest(session: appSessions.baseURLSession)
            await invoke(response)
        } catch {
            LogKit.print("Failed ->", error.localizedDescription); failed("Failed")
        }
    }
    
    @BackgroundActor
    func register(body: RegisterRequest, invoke: @escaping @BackgroundActor (BaseMessageResponse) async -> Void, failed: @BackgroundActor (String) -> Void) async {
        guard let url = URL(string: SecureConst.BASE_URL + Endpoint.REGISTER) else {
            LogKit.print("register Invalid URL"); failed("Failed")
            return
        }
        do {
            let response: BaseMessageResponse = try await url.createPOSTRequest(body: body).addAuthorizationHeader().performRequest(session: appSessions.baseURLSession)
            await invoke(response)
        } catch {
            LogKit.print("Failed ->", error.localizedDescription); failed("Failed")
        }
    }

    
    @BackgroundActor
    func login(body: LoginRequest, invoke: @escaping @BackgroundActor (LoginResponse) -> Void, failed: @BackgroundActor (String) -> Void) async {
        guard let url = URL(string: SecureConst.BASE_URL + Endpoint.LOGIN) else {
            LogKit.print("login Invalid URL"); failed("Failed")
            return
        }
        do {
            let response: LoginResponse = try await url.createPOSTRequest(body: body).addAuthorizationHeader().performRequest(session: appSessions.baseURLSession)
            invoke(response)
        } catch {
            LogKit.print("Failed ->", error.localizedDescription); failed("Failed")
        }
    }
    
    @BackgroundActor
    func fetchUserById(user: UserBase, invoke: @escaping @BackgroundActor (User) -> Void, failed: @BackgroundActor (String) -> Void) async {
        guard let url = URL(string: SecureConst.BASE_URL + Endpoint.USERS + user.id) else {
            LogKit.print("fetchUserById Invalid URL"); failed("Failed")
            return
        }
        do {
            let response: User = try await url.createGETRequest().addAuthorizationHeader(user).performRequest(session: appSessions.baseURLSession)
            invoke(response)
        } catch {
            LogKit.print("Failed ->", error.localizedDescription); failed("Failed")
        }
    }
    
    @BackgroundActor
    func fetchProfileById(user: UserBase, profileId: String, crypted: CryptoMode?, invoke: @escaping @BackgroundActor (Profile) -> Void, failed: @BackgroundActor (String) -> Void) async {
        guard let url = URL(string: SecureConst.BASE_URL + Endpoint.PROFILE + profileId) else {
            LogKit.print("fetchProfileById Invalid URL"); failed("Failed")
            return
        }
        do {
            let request = try url.createGETRequest().addAuthorizationHeader(user, crypted)
            if crypted == .receiveOnly || crypted == .doubleCrypto {
                let response: EncryptedCloud = try await request.performRequest(session: appSessions.disableCache)
                let profile: Profile = try await self.secureSession.decryptFromBackend(encrypted: response.encrypted)
                invoke(profile)
            } else {
                if let haveCache: Profile = appSessions.baseURLSession.tryFetchCache(request: request) {
                    invoke(haveCache)
                }
                let profile: Profile = try await request.performRequest(session: appSessions.baseURLSession)
                invoke(profile)
            }
        } catch {
            LogKit.print("Failed ->", error.localizedDescription); failed("Failed")
        }
    }
    
    @BackgroundActor
    func updateUserById(token: String, user: User, invoke: @escaping @BackgroundActor (BaseMessageResponse) -> Void, failed: @BackgroundActor (String) -> Void) async {
        guard let url = URL(string: SecureConst.BASE_URL + Endpoint.USERS + user.id) else {
            LogKit.print("updateUserById Invalid URL"); failed("Failed")
            return
        }
        do {
            let response: BaseMessageResponse = try await url.createPUTRequest(body: user).addAuthorizationHeader(id: user.id, token: token).performRequest(session: appSessions.baseURLSession)
            invoke(response)
        } catch {
            LogKit.print("Failed ->", error.localizedDescription); failed("Failed")
        }
    }
    
    @BackgroundActor
    func updateUserById(userBase: UserBase, user: UpdateUser, invoke: @escaping @BackgroundActor (BaseMessageResponse) -> Void, failed: @BackgroundActor (String) -> Void) async {
        guard let url = URL(string: SecureConst.BASE_URL + Endpoint.USERS + userBase.id) else {
            LogKit.print("updateUserById Invalid URL"); failed("Failed")
            return
        }
        do {
            let response: BaseMessageResponse = try await url.createPATCHRequest(body: user).addAuthorizationHeader(userBase).performRequest(session: appSessions.baseURLSession)
            invoke(response)
        } catch {
            LogKit.print("Failed ->", error.localizedDescription); failed("Failed")
        }
    }
}
