//
//  ShortVideoRepoImp.swift
//  DriveLine
//
//  Created by OmAr Kader on 17/11/2025.
//

import Foundation
import SwiftUISturdy
import CouchbaseLiteSwift

final class ShortVideoRepoImp : ShortVideoRepo {

    private let db: CouchbaseLocal?
    
    init(db: CouchbaseLocal?) {
        self.db = db
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
        await invoke(fetchLocalLast50Videos())
        do {
            let response: GetShortsWithUserRespond = try await url.createGETRequest().addAuthorizationHeader(userBase).performRequest()
            invoke(response.data)
            await insert(response.data)
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
    
    
    @BackgroundActor
    func fetchLocalLast50Videos() async -> [ShortVideoUser] {
        do {
            guard let collection = try? db?.collectionShorts else {
                return []
            }
            
            let query = QueryBuilder
                .select(
                    SelectResult.expression(Meta.id).as(ShortVideoUser.CodingKeys.id.rawValue),
                    SelectResult.all()
                )
                .from(DataSource.collection(collection))
            
            let results = try query.execute()
            var shorts: [ShortVideoUser] = []
            
            for result in results {
                guard let id = result.string(forKey: ShortVideoUser.CodingKeys.id.rawValue),
                      let document = try collection.document(id: id),
                      let short = ShortVideoUser.fromDocument(document) else {
                    continue
                }
                shorts.append(short)
            }
            return shorts//.unique(by: { $0.link })
        } catch {
            LogKit.print("Error fetching prefs: \(error)")
            return []
        }
    }
    
    
    @BackgroundActor
    func insert(_ shorts: [ShortVideoUser]) async {
        do {
            try? db?.dropCollectionShorts()
            await Task.sleep(seconds: 0.1)
            
            guard let collection = try? db?.collectionShorts else {
                return
            }
            
            try db?.database?.inBatch {
                for short in shorts {
                    guard let doc = short.toDocument() else {
                        continue
                    }
                    try collection.save(document: doc)
                }
            }
        } catch {
            LogKit.print("Error inserting insert: \(error)")
        }
    }
}
