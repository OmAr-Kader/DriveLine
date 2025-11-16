//
//  CourseRepo.swift
//  DriveLine
//
//  Created by OmAr Kader on 16/11/2025.
//

import Foundation
import SwiftUISturdy

internal protocol CourseRepo : Sendable {
            
    @BackgroundActor
    func createCourse(userBase: UserBase, body: ProvideCourseRequest, invoke: @escaping @BackgroundActor (ProvideCourseRequest) -> Void, failed: @escaping (String) -> Void) async
    
    @BackgroundActor
    func updateCourse(userBase: UserBase, courseProvidedId: String, body: UpdateProvidedCourseRequest, invoke: @escaping @BackgroundActor (ProvideCourseRequest) -> Void, failed: @escaping (String) -> Void) async
    
    @BackgroundActor
    func getCourseById(userBase: UserBase, courseProvidedId: String, invoke: @escaping (GetACourseRespond) -> Void, failed: @escaping (String) -> Void) async
    
    @BackgroundActor
    func getCoursesByCourseAdminId(userBase: UserBase, courseAdminId: Int, invoke: @escaping ([GetACourseRespond]) -> Void, failed: @escaping (String) -> Void) async
        
    @BackgroundActor
    func getCoursesByTech(userBase: UserBase, techId: String, invoke: @escaping ([ProvideCourseRequest]) -> Void, failed: @escaping (String) -> Void) async
}
