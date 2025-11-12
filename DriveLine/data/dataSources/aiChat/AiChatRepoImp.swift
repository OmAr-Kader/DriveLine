//
//  AiChatRepoImp.swift
//  DriveLine
//
//  Created by OmAr Kader on 11/11/2025.
//

import Foundation
import SwiftUISturdy

final class AiChatRepoImp : AiChatRepo {

    @BackgroundActor
    func createSessionWithMessage(userBase: UserBase, body: CreateSessionRequest, invoke: @escaping @BackgroundActor (CreateSessionResponse) -> Void, failed: @escaping (String) -> Void) async {
        guard let url = URL(string: SecureConst.BASE_URL + Endpoint.SESSION_WITH_FIRST_MESSAGE) else {
            LogKit.print("createSessionWithMessage Invalid URL"); failed("Failed")
            return
        }
        do {
            let response: CreateSessionResponse = try await url.createPOSTRequest(body: body).addAuthorizationHeader(userBase).performRequest()
            invoke(response)
        } catch {
            LogKit.print("Failed ->", error.localizedDescription); failed("Failed")
        }
    }
    
    @BackgroundActor
    @inlinable func addMessage(userBase: UserBase, body: CreateMessageRequest, invoke: @escaping (AiMessage) -> Void, failed: @escaping (String) -> Void) async {
        guard let url = URL(string: SecureConst.BASE_URL + Endpoint.MESSAGE) else {
            LogKit.print("addMessage Invalid URL"); failed("Failed")
            return
        }
        do {
            let response: AiMessage = try await url.createPOSTRequest(body: body).addAuthorizationHeader(userBase).performRequest()
            invoke(response)
        } catch {
            LogKit.print("Failed ->", error.localizedDescription); failed("Failed")
        }
    }
    
    @BackgroundActor
    func getSessions(userBase: UserBase, invoke: @escaping ([AiSession]) -> Void, failed: @escaping (String) -> Void) async {
        guard let url = URL(string: SecureConst.BASE_URL + Endpoint.SESSION) else {
            LogKit.print("getSessions Invalid URL"); failed("Failed")
            return
        }
        do {
            let response: [AiSession] = try await url.createGETRequest().addAuthorizationHeader(userBase).performRequest()
            invoke(response)
        } catch {
            LogKit.print("Failed ->", error.localizedDescription); failed("Failed")
        }
    }
    
    @BackgroundActor
    func getSessionMessages(userBase: UserBase, sessionId: String, invoke: @escaping ([AiMessage]) -> Void, failed: @escaping (String) -> Void) async {
        guard let url = URL(string: SecureConst.BASE_URL + Endpoint.sessionById(sessionId)) else {
            LogKit.print("getSessionMessages Invalid URL"); failed("Failed")
            return
        }
        do {
            let response: [AiMessage] = try await url.createGETRequest().addAuthorizationHeader(userBase).performRequest()
            invoke(response)
        } catch {
            LogKit.print("Failed ->", error.localizedDescription); failed("Failed")
        }
    }
        
    @BackgroundActor
    func deleteMessage(userBase: UserBase, id: String, invoke: @escaping (BaseSuccessResponse) -> Void, failed: @escaping (String) -> Void) async {
        guard let url = URL(string: SecureConst.BASE_URL + Endpoint.MESSAGE + id) else {
            LogKit.print("deleteMessage Invalid URL"); failed("Failed")
            return
        }
        do {
            let response: BaseSuccessResponse = try await url.createDELETERequest().addAuthorizationHeader(userBase).performRequest()
            invoke(response)
        } catch {
            LogKit.print("Failed ->", error.localizedDescription); failed("Failed")
        }
    }
    
    @BackgroundActor
    func deleteMessage(userBase: UserBase, id: [String], invoke: @escaping (BaseSuccessResponse) -> Void, failed: @escaping (String) -> Void) async {
        for it in id {
            await deleteMessage(userBase: userBase, id: it, invoke: invoke, failed: failed)
        }
    }
    
    @BackgroundActor
    func deleteSession(userBase: UserBase, id: String, invoke: @escaping (BaseSuccessResponse) -> Void, failed: @escaping (String) -> Void) async {
        guard let url = URL(string: SecureConst.BASE_URL + Endpoint.SESSION + id) else {
            LogKit.print("deleteMessage Invalid URL"); failed("Failed")
            return
        }
        do {
            let response: BaseSuccessResponse = try await url.createDELETERequest().addAuthorizationHeader(userBase).performRequest()
            invoke(response)
        } catch {
            LogKit.print("Failed ->", error.localizedDescription); failed("Failed")
        }
    }
    
}

extension URL {
    
    
    /// Creates a DELETE request with JSON headers.
    /// - Returns: A configured `URLRequest` using the DELETE method.
    @BackgroundActor
    public func createDELETERequest() throws -> URLRequest {
        var request = URLRequest(url: self)
        request.httpMethod = "DELETE"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        return request
    }
}
