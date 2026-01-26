//
//  ShortVideoRepo.swift
//  DriveLine
//
//  Created by OmAr Kader on 17/11/2025.
//

import SwiftUISturdy

internal protocol ShortVideoRepo : Sendable {
    
    
    @BackgroundActor
    func createShortVideo(userBase: UserBase, body: ShortVideo, invoke: @escaping @BackgroundActor (ShortVideo) -> Void, failed: @escaping (String) -> Void) async
    
    @BackgroundActor
    func fetchVideosByTag(userBase: UserBase, tag: Int, invoke: @escaping @BackgroundActor ([ShortVideoUser]) -> Void, failed: @escaping (String) -> Void) async
    
    @BackgroundActor
    func fetchLast50Videos(userBase: UserBase, limit: Int, skip: Int, needCache: Bool, crypted: CryptoMode?, invoke: @escaping @BackgroundActor ([ShortVideoUser]) -> Void, failed: @escaping (String) -> Void) async
    
    @BackgroundActor
    func increaseViews(userBase: UserBase, shortId: String) async
}
