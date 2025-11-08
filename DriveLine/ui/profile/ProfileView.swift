//
//  ProfileView.swift
//  DriveLine
//
//  Created by OmAr Kader on 08/11/2025.
//

import SwiftUI
import SwiftUISturdy

struct ProfileView: View {
    
    var app: BaseAppObserve
    var obs: HomeObserve = HomeObserve()
        
    @State private var path = NavigationPath()

    var locationText: String {
        guard let location = obs.state.user?.location else { return "" }
        let components = [location.building ?? "", location.street ?? "", location.city ?? ""].filter { !$0.isEmpty }
        return (location.unit != nil ? "Unit: \(location.unit!) - " : "") + components.joined(separator: ", ")
    }
    
    var body: some View {
        ZStack {
            VStack {
                // Profile Image
                if let profileImage = obs.state.user?.image {
                    KingsImage(urlString: profileImage, size: CGSize(width: 120, height: 120), radius: 60, backColor: .backDarkSec)
                        .clipShape(Circle())
                        .overlay(
                            Circle()
                                .stroke(.primaryOfApp, lineWidth: 3)
                        )
                } else {
                    Image(systemName: "person.circle.fill")
                        .resizable()
                        .scaledToFill()
                        .frame(width: 120, height: 120)
                        .clipShape(Circle())
                        .overlay(
                            Circle()
                                .stroke(.primaryOfApp, lineWidth: 3)
                        )
                }
                Spacer().height(10)
                // Name
                Text(app.state.userBase?.name ?? "")
                    .font(.system(size: 28, weight: .bold))
                    .foregroundColor(.textOfApp)
                
                Spacer().height(10)
                // Location
                Text(locationText)
                    .font(.system(size: 16))
                    .foregroundColor(.textGray)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
                    .height(30)
                
                Spacer().height(10)
                // Edit Profile Button
                Button(action: {
                    guard obs.state.user != nil else { return }
                    self.obs.sheet(isEditSheet: true)
                }) {
                    HStack {
                        Image(systemName: "pencil")
                        Text("Edit Profile")
                    }
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.textForPrimary)
                    .frame(width: 200, height: 50)
                    .background(.primaryOfApp)
                    .cornerRadius(12)
                    .apply {
                        if #available(iOS 26.0, *) {
                            $0.glassEffect(in: .rect(cornerRadius: 12.0))
                        }
                    }
                }
                
                VStack(spacing: 0) {
                    Spacer()
                    // Your items will go here
                    // Example placeholder:
                    // ItemBar(title: "Schedule an Appointment", icon: "calendar")
                    // ItemBar(title: "Settings", icon: "gearshape")
                }
            }
            if !obs.state.isEditSheet {
                LoadingScreen(color: .primaryOfApp, backDarkAlpha: .backDarkAlpha, isLoading: obs.state.isLoading)
            }
        }
        .apply {
            if !obs.state.isEditSheet {
                $0.toastView(toast: obs.toast, textColor: .textOfApp, backDarkSec: .backDarkSec)
            }
        }.onAppeared {
            obs.fetchUser(app.state.userBase)
        }.sheet(isPresented: obs.isEditSheet) {
            if let user = obs.state.user {
                EditProfileSheet(path: $path, user: user, toast: obs.toast, isLoading: obs.state.isLoading) {
                    obs.updateUser(userBase: app.state.userBase, userEdit: $0) { newUser in
                        app.updateUserBase(name: newUser.name, email: newUser.email) {
                            self.obs.offLoading(user: newUser)
                        }
                    }
                } onDismiss: {
                    self.obs.sheet(isEditSheet: false)
                }.presentationDetents([.large])
                    .presentationDragIndicator(.visible)
                    .id("SHEET_EDIT_PROFILE")
            } else {
                VStack {}
            }
        }
    }
}

struct EditProfileSheet: View {
    
    @State var userEdit: UserEdit
    @Binding var toast: Toast?
    let isLoading: Bool
    let onEdit: (UserEdit) -> Void
    let onDismiss: () -> Void
    @Binding private var path: NavigationPath
    
    init(path: Binding<NavigationPath>, user: User, toast: Binding<Toast?>, isLoading: Bool, onEdit: @escaping (UserEdit) -> Void, onDismiss: @escaping () -> Void) {
        self._path = path
        self._userEdit = State(wrappedValue: UserEdit(user: user))
        self._toast = toast
        self.isLoading = isLoading
        self.onEdit = onEdit
        self.onDismiss = onDismiss
    }

    var body: some View {
        NavigationStack(path: $path) {
            ZStack {
                ScrollView {
                    VStack(spacing: 25) {
                        
                        // Profile Image with tap gesture
                        Button(action: {
                            // Handle PhotoPicker here
                        }) {
                            ZStack {
                                if let profileImage = userEdit.image {
                                    KingsImage(urlString: profileImage, size: CGSize(width: 100, height: 100), radius: 60, backColor: .backDarkSec)
                                        .clipShape(Circle())
                                        .overlay(
                                            Circle()
                                                .stroke(.primaryOfApp, lineWidth: 3)
                                        )
                                } else {
                                    Image(systemName: "person.circle.fill")
                                        .resizable()
                                        .scaledToFill()
                                        .frame(width: 100, height: 100)
                                        .clipShape(Circle())
                                        .overlay(
                                            Circle()
                                                .stroke(.primaryOfApp, lineWidth: 3)
                                        )
                                }
                                
                                // Camera icon overlay
                                VStack {
                                    Spacer()
                                    HStack {
                                        Spacer()
                                        Image(systemName: "camera.fill")
                                            .foregroundColor(.white)
                                            .font(.system(size: 16))
                                            .padding(8)
                                            //.background(Color(uiColor: .systemBackground))
                                            .clipShape(Circle())
                                            .offset(x: -5, y: -5)
                                    }
                                }
                                .frame(width: 100, height: 100)
                            }
                            .overlay(
                                Circle()
                                    .stroke(.primaryOfApp, lineWidth: 2)
                            )
                        }
                        .padding(.top, 10)
                        
                        // Form Fields
                        VStack(spacing: 16) {
                            // Name Field
                            EditTextField(
                                text: Binding(get: { userEdit.name }, set: { userEdit = userEdit.copy(name: .set($0)) }),
                                placeholder: "Name",
                                icon: "person.fill"
                            )
                            
                            // Age Field
                            EditTextField(
                                text: Binding(get: { String(userEdit.age) }, set: {
                                    guard let age = Int($0) else { return }
                                    userEdit = userEdit.copy(age: .set(age))
                                }),
                                placeholder: "Age",
                                icon: "calendar",
                                keyboard: .numberPad
                            )
                            
                            // City Field
                            EditTextField(
                                text: Binding(get: { userEdit.city ?? "" }, set: { userEdit = userEdit.copy(city: .set($0)) }),
                                placeholder: "City",
                                icon: "building.2.fill"
                            )
                            
                            // Street Field
                            EditTextField(
                                text: Binding(get: { userEdit.street ?? "" }, set: { userEdit = userEdit.copy(street: .set($0)) }),
                                placeholder: "Street",
                                icon: "road.lanes"
                            )
                            
                            // Building Field
                            EditTextField(
                                text: Binding(get: { userEdit.building ?? "" }, set: { userEdit = userEdit.copy(building: .set($0)) }),
                                placeholder: "Building",
                                icon: "building.fill"
                            )
                            
                            // Unit Field
                            EditTextField(
                                text: Binding(get: { userEdit.unit ?? "" }, set: { userEdit = userEdit.copy(unit: .set($0)) }),
                                placeholder: "Unit",
                                icon: "door.left.hand.open"
                            )
                        }
                        .padding(.horizontal, 30)
                        .padding(.top, 10)
                    }
                }
                LoadingScreen(color: .primaryOfApp, backDarkAlpha: .backDarkAlpha, isLoading: isLoading)
            }.toastView(toast: $toast, textColor: .textOfApp, backDarkSec: .backDarkSec)
                .hideToolbar()
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Close") {
                            guard !isLoading else { return }
                            onDismiss()
                        }
                    }
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Done") {
                            guard !isLoading else { return }
                            dismissKeyboard()
                            onEdit(userEdit)
                        }
                    }
                }
        }
    }
}

struct EditTextField: View {
    @Binding var text: String
    let placeholder: String
    let icon: String
    let keyboard: UIKeyboardType
    
    init(text: Binding<String>, placeholder: String, icon: String, keyboard: UIKeyboardType = .default) {
        self._text = text
        self.placeholder = placeholder
        self.icon = icon
        self.keyboard = keyboard
    }
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(.primaryOfApp)
                .frame(width: 20)
                .alignmentGuide(VerticalAlignment.center) { d in d[.top] + 10 }
            
            ZStack(alignment: .topLeading) {
                TextField(placeholder, text: $text)
                    .foregroundColor(.textOfApp)
                    .scrollContentBackground(.hidden)
                    .background(Color.clear)
                    .frame(height: 40)
                    .autocapitalization(.words)
                    .keyboardType(keyboard)
            }
        }
        .padding()
        .background(Color.white.opacity(0.1))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(.primaryOfApp.opacity(0.3), lineWidth: 1)
        )
    }
}
