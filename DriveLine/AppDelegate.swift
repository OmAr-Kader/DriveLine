//
//  AppDelegate.swift
//  DriveLine
//
//  Created by OmAr Kader on 05/11/2025.
//
import Foundation
import SwiftUI

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


extension UIViewController {
    var appDelegate: AppDelegate {
        return UIApplication.shared.delegate as! AppDelegate
    }
}


