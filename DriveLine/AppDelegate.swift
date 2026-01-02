//
//  AppDelegate.swift
//  DriveLine
//
//  Created by OmAr Kader on 05/11/2025.
//
import Foundation
import CryptoKit
import os
import UIKit
import SwiftUISturdy

@MainActor
class AppDelegate: NSObject, UIApplicationDelegate {
    private(set) var appSet: BaseAppObserve! = nil

    var app: BaseAppObserve {
        guard let appSet else {
            let app = BaseAppObserve()
            self.appSet = app
            return app
        }
        return appSet
    }

    func applicationWillTerminate(_ application: UIApplication) {
        appSet = nil
    }

}



final class ServerTrustDelegate: NSObject, URLSessionDelegate {
    static let shared = ServerTrustDelegate()
    private override init() { super.init() }

    func urlSession(_ session: URLSession,
                    didReceive challenge: URLAuthenticationChallenge,
                    completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
        LogKit.print("Received server trust challenge for host: \(challenge.protectionSpace.host)")
        let protectionSpace = challenge.protectionSpace
        if protectionSpace.authenticationMethod == NSURLAuthenticationMethodServerTrust,
           let serverTrust = protectionSpace.serverTrust {
            // Replace with proper validation / pinning for production
            let credential = URLCredential(trust: serverTrust)
            completionHandler(.useCredential, credential)
        } else {
            completionHandler(.performDefaultHandling, nil)
        }
    }
}

extension UIViewController {
    var appDelegate: AppDelegate {
        return UIApplication.shared.delegate as! AppDelegate
    }
}



