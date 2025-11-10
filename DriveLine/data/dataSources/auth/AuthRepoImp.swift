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
    func register(body: RegisterRequest, invoke: @escaping @BackgroundActor (BaseResponse) async -> Void, failed: @BackgroundActor (String) -> Void) async {
        guard let url = URL(string: SecureConst.BASE_URL + Endpoint.REGISTER) else {
            LogKit.print("sendAppVersion Invalid URL"); failed("Failed")
            return
        }
        do {
            let response: BaseResponse = try await url.createPOSTRequest(body: body).addAuthorizationHeader().performRequest()
            await invoke(response)
        } catch {
            LogKit.print("Failed ->", error.localizedDescription); failed("Failed")
        }
    }
    
    
    @BackgroundActor
    func login(body: LoginRequest, invoke: @escaping @BackgroundActor (LoginResponse) -> Void, failed: @BackgroundActor (String) -> Void) async {
        guard let url = URL(string: SecureConst.BASE_URL + Endpoint.LOGIN) else {
            LogKit.print("sendAppVersion Invalid URL"); failed("Failed")
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
            LogKit.print("sendAppVersion Invalid URL"); failed("Failed")
            return
        }
        do {
            let response: User = try await url.createGETRequest().addAuthorizationHeader(id: user.id, token: user.token).performRequest()
            invoke(response)
        } catch {
            LogKit.print("Failed ->", error.localizedDescription); failed("Failed")
        }
    }
    
    @BackgroundActor
    func updateUserById(token: String, user: User, invoke: @escaping @BackgroundActor (BaseResponse) -> Void, failed: @BackgroundActor (String) -> Void) async {
        guard let url = URL(string: SecureConst.BASE_URL + Endpoint.USERS + user.id) else {
            LogKit.print("sendAppVersion Invalid URL"); failed("Failed")
            return
        }
        do {
            let response: BaseResponse = try await url.createPUTRequest(body: user).addAuthorizationHeader(id: user.id, token: token).performRequest()
            invoke(response)
        } catch {
            LogKit.print("Failed ->", error.localizedDescription); failed("Failed")
        }
    }
    
}
