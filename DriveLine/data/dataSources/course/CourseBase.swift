//
//  CourseBase.swift
//  DriveLine
//
//  Created by OmAr Kader on 16/11/2025.
//

import Foundation
import SwiftUISturdy

final class CourseBase : Sendable {
            
    private let repo: CourseRepo
    
    init(repo: CourseRepo) {
        self.repo = repo
    }
    
    @BackgroundActor
    func createCourse(userBase: UserBase, body: ProvideCourseRequest, invoke: @escaping @BackgroundActor (ProvideCourseRequest) -> Void, failed: @escaping (String) -> Void) async {
        await repo.createCourse(userBase: userBase, body: body, invoke: invoke, failed: failed)
    }
    
    @BackgroundActor
    func updateCourse(userBase: UserBase, courseProvidedId: String, body: UpdateProvidedCourseRequest, invoke: @escaping @BackgroundActor (ProvideCourseRequest) -> Void, failed: @escaping (String) -> Void) async {
        await repo.updateCourse(userBase: userBase, courseProvidedId: courseProvidedId, body: body, invoke: invoke, failed: failed)
    }
    
    @BackgroundActor
    func getCourseById(userBase: UserBase, courseProvidedId: String, invoke: @escaping (GetACourseRespond) -> Void, failed: @escaping (String) -> Void) async {
        await repo.getCourseById(userBase: userBase, courseProvidedId: courseProvidedId, invoke: invoke, failed: failed)
    }
    
    @BackgroundActor
    func getCoursesByCourseAdminId(userBase: UserBase, courseAdminId: Int, invoke: @escaping ([GetACourseRespond]) -> Void, failed: @escaping (String) -> Void) async {
        await repo.getCoursesByCourseAdminId(userBase: userBase, courseAdminId: courseAdminId, invoke: invoke, failed: failed)
    }
        
    @BackgroundActor
    func getCoursesByTech(userBase: UserBase, techId: String, invoke: @escaping ([ProvideCourseRequest]) -> Void, failed: @escaping (String) -> Void) async {
        await repo.getCoursesByTech(userBase: userBase, techId: techId, invoke: invoke, failed: failed)
    }
}
