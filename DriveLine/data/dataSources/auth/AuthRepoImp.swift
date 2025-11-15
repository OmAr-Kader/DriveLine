//
//  AuthRepoImp.swift
//  DriveLine
//
//  Created by OmAr Kader on 08/11/2025.
//

import Foundation
import SwiftUISturdy

final class AuthRepoImp : AuthRepo {
    
    @BackgroundActor
    func register(body: RegisterRequest, invoke: @escaping @BackgroundActor (BaseMessageResponse) async -> Void, failed: @BackgroundActor (String) -> Void) async {
        guard let url = URL(string: SecureConst.BASE_URL + Endpoint.REGISTER) else {
            LogKit.print("register Invalid URL"); failed("Failed")
            return
        }
        do {
            let response: BaseMessageResponse = try await url.createPOSTRequest(body: body).addAuthorizationHeader().performRequest()
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
            let response: LoginResponse = try await url.createPOSTRequest(body: body).addAuthorizationHeader().performRequest()
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
            let response: User = try await url.createGETRequest().addAuthorizationHeader(user).performRequest()
            invoke(response)
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
            let response: BaseMessageResponse = try await url.createPUTRequest(body: user).addAuthorizationHeader(id: user.id, token: token).performRequest()
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
            let response: BaseMessageResponse = try await url.createPATCHRequest(body: user).addAuthorizationHeader(userBase).performRequest()
            invoke(response)
        } catch {
            LogKit.print("Failed ->", error.localizedDescription); failed("Failed")
        }
    }
}
