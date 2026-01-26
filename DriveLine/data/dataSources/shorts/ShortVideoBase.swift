//
//  ShortVideoBase.swift
//  DriveLine
//
//  Created by OmAr Kader on 17/11/2025.
//


import Foundation
import SwiftUISturdy

final class ShortVideoBase {
    
    private let repo: ShortVideoRepo
    
    init(repo: ShortVideoRepo) {
        self.repo = repo
    }
 
    @BackgroundActor
    func createShortVideo(userBase: UserBase, body: ShortVideo, invoke: @escaping @BackgroundActor (ShortVideo) -> Void, failed: @escaping (String) -> Void) async {
        await repo.createShortVideo(userBase: userBase, body: body, invoke: invoke, failed: failed)
    }
    
    @BackgroundActor
    func fetchVideosByTag(userBase: UserBase, tag: Int, invoke: @escaping @BackgroundActor ([ShortVideoUser]) -> Void, failed: @escaping (String) -> Void) async {
        await repo.fetchVideosByTag(userBase: userBase, tag: tag, invoke: invoke, failed: failed)
    }
    
    @BackgroundActor
    func fetchLast50Videos(userBase: UserBase, limit: Int, skip: Int, needCache: Bool, crypted: CryptoMode? = nil, invoke: @escaping @BackgroundActor ([ShortVideoUser]) -> Void, failed: @escaping (String) -> Void) async {
        await repo.fetchLast50Videos(userBase: userBase, limit: limit, skip: skip, needCache: needCache, crypted: crypted, invoke: invoke, failed: failed)
    }
    
    @BackgroundActor
    func increaseViews(userBase: UserBase, shortId: String) async {
        await repo.increaseViews(userBase: userBase, shortId: shortId)
    }
    
}
