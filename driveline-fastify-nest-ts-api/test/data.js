// Test data, payload generators, and video list (ES module)

export const videos = [
  { link: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', thumbImageName: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg', title: 'Big Buck Bunny' },
  { link: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', thumbImageName: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg', title: 'Elephant Dream' },
  { link: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', thumbImageName: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg', title: 'For Bigger Blazes' },
  { link: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', thumbImageName: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg', title: 'For Bigger Escape' },
  { link: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', thumbImageName: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerFun.jpg', title: 'For Bigger Fun' },
  { link: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', thumbImageName: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg', title: 'For Bigger Joyrides' },
  { link: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', thumbImageName: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerMeltdowns.jpg', title: 'For Bigger Meltdowns' },
  { link: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', thumbImageName: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg', title: 'Sintel' },
  { link: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4', thumbImageName: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/SubaruOutbackOnStreetAndDirt.jpg', title: 'Subaru Outback On Street And Dirt' },
  { link: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', thumbImageName: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/TearsOfSteel.jpg', title: 'Tears of Steel' },
  { link: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4', thumbImageName: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/VolkswagenGTIReview.jpg', title: 'Volkswagen GTI Review' },
  { link: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4', thumbImageName: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/WeAreGoingOnBullrun.jpg', title: 'We Are Going On Bullrun' },
  { link: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4', thumbImageName: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/WhatCarCanYouGetForAGrand.jpg', title: 'What care can you get for a grand?' },
];

export function newUser() {
  // returns a full user object with randomized fields suitable for registration
  const unique = `${Date.now()}_${Math.floor(Math.random() * 9000 + 1000)}`;
  const user = {
    name: `k6-user-${unique}`,
    email: `k6+${unique}@example.com`,
    password: '123456789A$&',
    age: randInt(18, 60),
    role: Math.random() < 0.5 ? 'tech' : 'user',
    image: userImages[Math.floor(Math.random() * userImages.length)],
    phone: makeRandomPhone(),
    location: makeRandomLocation()
  };
  return user;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomTags(count = randInt(1, 4)) {
  const s = new Set();
  while (s.size < count) s.add(randInt(1, 20));
  return Array.from(s);
}

export function pickRandomVideo() {
  return videos[Math.floor(Math.random() * videos.length)];
}

export function makeShortsPayload() {
  const video = pickRandomVideo();
  return {
    link: video.link,
    title: `${video.title} - k6 ${Date.now()}`,
    thumbImageName: video.thumbImageName,
    tags: randomTags()
  };
} 

export function randomAvailability(dayOffChance = 0.15) {
  const dayOff = Math.random() < dayOffChance;
  if (dayOff) return { dayOff: true };
  const startUTC = randInt(6, 11); // 6am - 11am
  const endUTC = startUTC + randInt(4, 8); // 4-8 hours long
  return { startUTC, endUTC, dayOff: false };
}

export function makeFixServicePayload(techId = '') {
  return {
    techId: techId,
    serviceAdminId: 0,
    description: 'Full engine diagnostic and tune-up',
    price: (randInt(30, 200)).toFixed(2),
    currency: 'USD',
    durationMinutes: randInt(30, 180),
    isActive: true,
    monday: randomAvailability(),
    tuesday: randomAvailability(),
    wednesday: randomAvailability(),
    thursday: randomAvailability(),
    friday: randomAvailability(0.5),
    saturday: randomAvailability(0.35),
    sunday: randomAvailability(0.6)
  };
} 

export function makeCoursePayload(techId = '') {
  return {
    techId: techId,
    courseAdminId: 0,
    description: 'Course For Engine diagnostic and tune-up',
    price: (parseFloat((Math.random() * 200 + 10).toFixed(2))).toFixed(2),
    currency: 'USD',
    sessions: randInt(1, 8),
    isActive: true,
    monday: randomAvailability(0.15),
    tuesday: randomAvailability(0.15),
    wednesday: randomAvailability(0.15),
    thursday: randomAvailability(0.15),
    friday: randomAvailability(0.6),
    saturday: randomAvailability(0.35),
    sunday: randomAvailability(0.6)
  };
} 

// ---------- User generation utilities ----------

export const userImages = [
  "https://i.pravatar.cc/150?u=a042581f4e29026708c",
  "https://i.pravatar.cc/150?u=a04258114e29026709d",
  "https://i.pravatar.cc/150?u=a042581f4e29026702a",
  "https://i.pravatar.cc/150?u=a04258114e29026302d",
  "https://i.pravatar.cc/150?u=a042581f4e290267016",
  "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=250&h=250&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=250&h=250&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=250&h=250&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=250&h=250&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&h=250&auto=format&fit=crop"
];

const firstNames = ['Alex','Sam','Taylor','Jordan','Casey','Jamie','Morgan','Riley','Avery','Cameron'];
const lastNames = ['Smith','Johnson','Brown','Taylor','Anderson','Thomas','Jackson','White','Harris','Martin'];
const cities = ['San Francisco','Los Angeles','New York','Chicago','Austin','Seattle','Boston','Denver','San Diego','Portland'];
const states = ['California','New York','Illinois','Texas','Washington','Massachusetts','Colorado','Oregon'];

function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

export function makeRandomPhone() {
  // Egyptian mobile example +2010******** or +2012********
  const prefix = Math.random() < 0.5 ? '+2010' : '+2012';
  const tail = Array.from({length:8}).map(()=>Math.floor(Math.random()*10)).join('');
  return `${prefix}${tail}`;
}

export function makeRandomLocation() {
  return {
    country: 'United States',
    state: randomFrom(states),
    city: randomFrom(cities),
    street: `${randInt(1,999)} ${randomFrom(['Market St','Broadway','Main St','1st Ave','2nd Ave','Pine St','Elm St'])}`,
    building: `${randInt(1,300)}`,
    floor: `${randInt(1,12)}`,
    unit: `${randInt(1,999)}`,
    postal_code: `${randInt(90000,99999)}`
  };
}

export function makeRandomUser(roleOverride) {
  const first = randomFrom(firstNames);
  const last = randomFrom(lastNames);
  const name = `${first} ${last}`;
  const age = randInt(18, 60);
  const role = roleOverride || (Math.random() < 0.5 ? 'tech' : 'user');
  const image = randomFrom(userImages);
  const phone = makeRandomPhone();
  const location = makeRandomLocation();
  return {
    name,
    age,
    role,
    image,
    phone,
    location
  };
}

export function makeUsers(count = 10) {
  const users = [];
  for (let i = 0; i < count; i++) {
    const u = makeRandomUser();
    // add unique email/password so these can be used for register/login if needed
    const unique = Date.now() + i + Math.floor(Math.random() * 9000 + 1000);
    users.push(Object.assign({}, u, { email: `k6+${unique}@example.com`, password: '123456789A$&' }));
  }
  return users;
}

export const sampleUsers = makeUsers(10);