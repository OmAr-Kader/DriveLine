//
//  ShortVideoRepoImp.swift
//  DriveLine
//
//  Created by OmAr Kader on 17/11/2025.
//

import Foundation
import SwiftUISturdy

final class ShortVideoRepoImp : ShortVideoRepo {
    
    let appSessions: AppURLSessions
    let secureSession: SecureSessionManager

    init(appSessions: AppURLSessions, secureSession: SecureSessionManager) {
        self.appSessions = appSessions
        self.secureSession = secureSession
    }
    
    @BackgroundActor
    func createShortVideo(userBase: UserBase, body: ShortVideo, invoke: @escaping @BackgroundActor (ShortVideo) -> Void, failed: @escaping (String) -> Void) async {
        guard let url = URL(string: SecureConst.BASE_URL + Endpoint.SHORTS) else {
            LogKit.print("createShortVideo Invalid URL"); failed("Failed")
            return
        }
        do {
            let response: ShortVideo = try await url.createPOSTRequest(body: body).addAuthorizationHeader(userBase).performRequest(session: appSessions.disableCache)
            invoke(response)
        } catch {
            LogKit.print("Failed ->", error.localizedDescription); failed("Failed")
        }
    }
    
    @BackgroundActor
    func fetchVideosByTag(userBase: UserBase, tag: Int, invoke: @escaping @BackgroundActor ([ShortVideoUser]) -> Void, failed: @escaping (String) -> Void) async {
        guard let url = URL(string: SecureConst.BASE_URL + Endpoint.shortsByTag(tag)) else {
            LogKit.print("fetchVideosByTag Invalid URL"); failed("Failed")
            return
        }
        do {
            let response: GetShortsWithUserRespond = try await url.createGETRequest().addAuthorizationHeader(userBase).performRequest(session: appSessions.disableCache)
            invoke(response.data.videos)
        } catch {
            LogKit.print("Failed ->", error.localizedDescription); failed("Failed")
        }
    }
    
    @BackgroundActor
    func fetchLast50Videos(userBase: UserBase, limit: Int, skip: Int, needCache: Bool, crypted: CryptoMode?, invoke: @escaping @BackgroundActor ([ShortVideoUser]) -> Void, failed: @escaping (String) -> Void) async {
        guard let url = URL(string: SecureConst.BASE_URL + Endpoint.SHORTS_LATEST + "?limit=\(limit)&skip=\(skip)") else {
            LogKit.print("fetchLast50Videos Invalid URL"); failed("Failed")
            return
        }
        
        do {
            let request = try url.createGETRequest().addAuthorizationHeader(userBase, crypted)
            if crypted == .receiveOnly || crypted == .doubleCrypto {
                let response: GetShortsWithUserRespond = try await withRetry { [weak self] in
                    guard let self = self else {
                        throw NSError(domain: "ShortVideoRepoImp", code: -1, userInfo: [NSLocalizedDescriptionKey: "Service deallocated"])
                    }
                    let data: EncryptedCloud = try await request.performRequest(session: appSessions.disableCache)
                    return try await self.secureSession.decryptFromBackend(encrypted: data.encrypted)
                }
                invoke(response.data.videos)
            } else {
                if needCache {
                    if let haveCache: GetShortsWithUserRespond = appSessions.baseURLSession.tryFetchCache(request: request) {
                        invoke(haveCache.data.videos)
                    }
                }
                let response: GetShortsWithUserRespond = try await withRetry { [weak self] in
                    guard let self = self else {
                        throw NSError(domain: "ShortVideoRepoImp", code: -1, userInfo: [NSLocalizedDescriptionKey: "Service deallocated"])
                    }
                    return try await request.performRequest(session: appSessions.baseURLSession)
                }
                invoke(response.data.videos)
            }
        } catch {
            // try before failed("Failed")
            LogKit.print("Failed ->", error.localizedDescription); failed("Failed")
        }
    }
    
    @BackgroundActor
    func increaseViews(userBase: UserBase, shortId: String) async {
        guard let url = URL(string: SecureConst.BASE_URL + Endpoint.SHORTS + shortId) else {
            LogKit.print("increaseViews Invalid URL")
            return
        }
        do {
            try await url.createPOSTRequest(body: BaseMessageResponse(message: "dummy")).addAuthorizationHeader(userBase).performRequestSafe(session: appSessions.disableCache)
        } catch {
            LogKit.print("Failed ->", error.localizedDescription)
        }
    }
}
