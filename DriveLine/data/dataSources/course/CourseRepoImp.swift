//
//  CourseRepoImp.swift
//  DriveLine
//
//  Created by OmAr Kader on 16/11/2025.
//

import Foundation
import SwiftUISturdy

final class CourseRepoImp : CourseRepo {
    
    let appSessions: AppURLSessions

    init(appSessions: AppURLSessions) {
        self.appSessions = appSessions
    }
            
    @BackgroundActor
    func createCourse(userBase: UserBase, body: ProvideCourseRequest, invoke: @escaping @BackgroundActor (ProvideCourseRequest) -> Void, failed: @escaping (String) -> Void) async {
        guard let url = URL(string: SecureConst.BASE_URL + Endpoint.COURSES) else {
            LogKit.print("createCourse Invalid URL"); failed("Failed")
            return
        }
        do {
            let response: ProvideCourseRequest = try await url.createPOSTRequest(body: body).addAuthorizationHeader(userBase).performRequest(session: appSessions.disableCache)
            invoke(response)
        } catch {
            LogKit.print("Failed ->", error.localizedDescription); failed("Failed")
        }
    }
    
    @BackgroundActor
    func updateCourse(userBase: UserBase, courseProvidedId: String, body: UpdateProvidedCourseRequest, invoke: @escaping @BackgroundActor (ProvideCourseRequest) -> Void, failed: @escaping (String) -> Void) async {
        guard let url = URL(string: SecureConst.BASE_URL + Endpoint.COURSES + courseProvidedId) else {
            LogKit.print("updateCourse Invalid URL"); failed("Failed")
            return
        }
        do {
            let response: ProvideCourseRequest = try await url.createPATCHRequest(body: body).addAuthorizationHeader(userBase).performRequest(session: appSessions.disableCache)
            invoke(response)
        } catch {
            LogKit.print("Failed ->", error.localizedDescription); failed("Failed")
        }
    }
    
    @BackgroundActor
    func getCourseById(userBase: UserBase, courseProvidedId: String, invoke: @escaping (GetACourseRespond) -> Void, failed: @escaping (String) -> Void) async {
        guard let url = URL(string: SecureConst.BASE_URL + Endpoint.COURSES + courseProvidedId) else {
            LogKit.print("getCourseById Invalid URL"); failed("Failed")
            return
        }
        do {
            let response: GetCourseResponse = try await url.createGETRequest().addAuthorizationHeader(userBase).performRequest(session: appSessions.disableCache)
            invoke(response.course)
        } catch {
            LogKit.print("Failed ->", error.localizedDescription); failed("Failed")
        }
    }
    
    @BackgroundActor
    func getCoursesByCourseAdminId(userBase: UserBase, courseAdminId: Int, invoke: @escaping ([GetACourseRespond]) -> Void, failed: @escaping (String) -> Void) async {
        guard let url = URL(string: SecureConst.BASE_URL + Endpoint.coursesByCourseAdminId(courseAdminId)) else {
            LogKit.print("getCoursesByCourseAdminId Invalid URL"); failed("Failed")
            return
        }
        do {
            let response: GetACourseRootRespond = try await url.createGETRequest().addAuthorizationHeader(userBase).performRequest(session: appSessions.disableCache)
            invoke(response.data)
        } catch {
            LogKit.print("Failed ->", error.localizedDescription); failed("Failed")
        }
    }
        
    @BackgroundActor
    func getCoursesByTech(userBase: UserBase, techId: String, invoke: @escaping ([ProvideCourseRequest]) -> Void, failed: @escaping (String) -> Void) async {
        guard let url = URL(string: SecureConst.BASE_URL + Endpoint.coursesByTechId(techId)) else {
            LogKit.print("getCoursesByTech Invalid URL"); failed("Failed")
            return
        }
        do {
            let response: ProvideCourseRequestRootRespond = try await url.createGETRequest().addAuthorizationHeader(userBase).performRequest(session: appSessions.disableCache)
            invoke(response.data)
        } catch {
            LogKit.print("Failed ->", error.localizedDescription); failed("Failed")
        }
    }
}
