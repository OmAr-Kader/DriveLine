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

    init(appSessions: AppURLSessions) {
        self.appSessions = appSessions
    }
    
    @BackgroundActor
    func createShortVideo(userBase: UserBase, body: ShortVideo, invoke: @escaping @BackgroundActor (ShortVideo) -> Void, failed: @escaping (String) -> Void) async {
        guard let url = URL(string: SecureConst.BASE_URL + Endpoint.SHORTS) else {
            LogKit.print("createShortVideo Invalid URL"); failed("Failed")
            return
        }
        do {
            let response: ShortVideo = try await url.createPOSTRequest(body: body).addAuthorizationHeader(userBase).performRequest()
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
            let response: GetShortsWithUserRespond = try await url.createGETRequest().addAuthorizationHeader(userBase).performRequest()
            invoke(response.data)
        } catch {
            LogKit.print("Failed ->", error.localizedDescription); failed("Failed")
        }
    }
    
    @BackgroundActor
    func fetchLast50Videos(userBase: UserBase, invoke: @escaping @BackgroundActor ([ShortVideoUser]) -> Void, failed: @escaping (String) -> Void) async {
        guard let url = URL(string: SecureConst.BASE_URL + Endpoint.SHORTS_LATEST) else {
            LogKit.print("fetchLast50Videos Invalid URL"); failed("Failed")
            return
        }
        
        do {
            let request = try url.createGETRequest().addAuthorizationHeader(userBase)
            if let haveCache: GetShortsWithUserRespond = appSessions.baseURLSession.tryFetchCache(request: request) {
                invoke(haveCache.data)
            }
            
            let response: GetShortsWithUserRespond = try await request.performRequest()
            invoke(response.data)
        } catch {
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
            try await url.createPOSTRequest(body: BaseMessageResponse(message: "dummy")).addAuthorizationHeader(userBase).performRequestSafe()
        } catch {
            LogKit.print("Failed ->", error.localizedDescription)
        }
    }
}
