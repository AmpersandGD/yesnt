const MAT_WIDTH = 10;
const MAT_LENGTH = 20;
const MAT_SPACING = 5;
const MAT_FIRST_ROW_Z = -450;
const MAT_COLOURS = [0xc98838, 0xbf4d4d, 0xbf4d4d, 0xbf4d4d, 0xbb6a78, 0x473068, 0x373e6f];
function createMat(x, z) {
  const mat = new THREE.Mesh(
    new THREE.BoxBufferGeometry(MAT_WIDTH, 0.4, MAT_LENGTH),
    new THREE.MeshStandardMaterial({
      color: MAT_COLOURS[Math.floor(Math.random() * MAT_COLOURS.length)],
      roughness: 0.9,
      metalness: 0.5
    })
  );
  mat.position.set(x, 0, z);
  return mat;
}

const wallMaterial = new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 0.9, metalness: 0.1});

const mats = [];
function setupRoom(scene, onframe,collisions) {
  const floor = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(1000, 1000),
    new THREE.MeshStandardMaterial({color: 0xF1C38E, roughness: 0.6, metalness: 0.2})
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // const lampSphere = new THREE.Mesh(
  //   new THREE.SphereBufferGeometry(3),
  //   new THREE.MeshStandardMaterial({emissive: 0xffd6aa, roughness: 0.6, metalness: 0.2})
  // );
  // lampSphere.position.set(0, 10, -450);
  // scene.add(lampSphere);
  //
  // const lamp = new THREE.PointLight(0xffd6aa, 0.8);
  // lamp.position.set(0, 10, -450);
  // scene.add(lamp);

  const frontWall = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(1000, 200),
    wallMaterial
  );
  frontWall.position.set(0, 100, -500);
  scene.add(frontWall);

  let dark = false;
  const darkRoom = createDarkRoom();
  const lightRoom = createLightRoom();
  scene.add(lightRoom);

  for (let x = -10; x <= 10; x++) {
    for (let z = 0; z < 6; z++) {
      const mat = createMat(x * (MAT_WIDTH + MAT_SPACING), MAT_FIRST_ROW_Z + z * (MAT_LENGTH + MAT_SPACING));
      scene.add(mat);
      mats.push(mat);
    }
  }

  const CANDLE_RADIUS = 0.1 + PLAYER_THICKNESS;
  objectLoader.load('./models/candle.json', model => {
    model.scale.multiplyScalar(0.5);
    const lights = [[-15, -480], [-20, -480], [-25, -480]].map(([x, z]) => {
      const candle = model.clone();
      const light = candle.getObjectByName('flame');
      candle.position.set(x, 0, z);
      collisions.push([x - CANDLE_RADIUS, x + CANDLE_RADIUS, z - CANDLE_RADIUS, z + CANDLE_RADIUS]);
      scene.add(candle);
      return light;
    });
    onframe.push(timeStamp => {
      lights[0].intensity = Math.sin(timeStamp / 243 + 1) * 0.01 + 0.1;
      lights[1].intensity = Math.sin(timeStamp / 305 + 2) * 0.01 + 0.1;
      lights[2].intensity = Math.sin(timeStamp / 288 + 3) * 0.01 + 0.1;
    });
  });

  const LAMP_RADIUS = 1.5 + PLAYER_THICKNESS;
  objectLoader.load('./models/better-lamp.json', lamp => {
    const [x, z] = [15, -480];
    lamp.position.set(x, 0, z);
    collisions.push([x - LAMP_RADIUS, x + LAMP_RADIUS, z - LAMP_RADIUS, z + LAMP_RADIUS]);
    scene.add(lamp);
  });

  const sound = new THREE.PositionalAudio(listener);
  audioLoader.load('sounds/sohum.mp3', buffer => {
    sound.setBuffer(buffer);
  	sound.setRefDistance(5);
  	if (!params.get('shut-up')) userInteraction.then(() => sound.play());
  });
  objectLoader.load('./models/cassette-player.json', cassettePlayer => {
    cassettePlayer.position.set(5, 0, -495);
    cassettePlayer.scale.multiplyScalar(3);
    scene.add(cassettePlayer);
    cassettePlayer.add(sound);
    collisions.push([5 - 4.5 - PLAYER_THICKNESS, 5 + 4.5 + PLAYER_THICKNESS, -495 - 1.5 - PLAYER_THICKNESS, -495 + 1.5 + PLAYER_THICKNESS]);
  });

  return {
    swap() {
      scene.remove(dark ? darkRoom : lightRoom);
      dark = !dark;
      scene.add(dark ? darkRoom : lightRoom);
    }
  };
}

function createDarkRoom() {
  const DARK_WALLS_HEIGHT = 200;
  const darkRoom = new THREE.Group();

  const backWall = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(1000, 200),
    wallMaterial
  );
  backWall.rotation.y = Math.PI;
  backWall.position.set(0, 100, 500);
  darkRoom.add(backWall);

  const leftWall = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(1000, DARK_WALLS_HEIGHT),
    wallMaterial
  );
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-500, DARK_WALLS_HEIGHT / 2, 0);
  darkRoom.add(leftWall);

  const DOOR_TUNNEL_HEIGHT = 60;
  const DOOR_TUNNEL_PADDING = 30;
  const DOOR_TUNNEL_WIDTH = 100;

  const rightWall = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(1000, DARK_WALLS_HEIGHT - DOOR_TUNNEL_HEIGHT),
    wallMaterial
  );
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(500, DOOR_TUNNEL_HEIGHT / 2 + DARK_WALLS_HEIGHT / 2, 0);
  darkRoom.add(rightWall);

  const rightWallLeftPanel = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(DOOR_TUNNEL_PADDING, DOOR_TUNNEL_HEIGHT),
    wallMaterial
  );
  rightWallLeftPanel.rotation.y = -Math.PI / 2;
  rightWallLeftPanel.position.set(500, DOOR_TUNNEL_HEIGHT / 2, -500 + DOOR_TUNNEL_PADDING / 2);
  darkRoom.add(rightWallLeftPanel);

  const rightWallMidPanel = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(1000 - (DOOR_TUNNEL_PADDING + DOOR_TUNNEL_WIDTH) * 2, DOOR_TUNNEL_HEIGHT),
    wallMaterial
  );
  rightWallMidPanel.rotation.y = -Math.PI / 2;
  rightWallMidPanel.position.set(500, DOOR_TUNNEL_HEIGHT / 2, 0);
  darkRoom.add(rightWallMidPanel);

  const rightWallRightPanel = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(DOOR_TUNNEL_PADDING, DOOR_TUNNEL_HEIGHT),
    wallMaterial
  );
  rightWallRightPanel.rotation.y = -Math.PI / 2;
  rightWallRightPanel.position.set(500, DOOR_TUNNEL_HEIGHT / 2, 500 - DOOR_TUNNEL_PADDING / 2);
  darkRoom.add(rightWallRightPanel);

  return darkRoom;
}

function createLightRoom() {
  const LIGHT_ROOM_HEIGHT = 100;
  const ROOM_LENGTH = 400;
  const ROOM_WIDTH = 500;
  const SLANT_HEIGHT = 20;
  const ROOF_ANGLE = Math.atan(SLANT_HEIGHT / (ROOM_LENGTH / 2));
  const ROOF_LENGTH = Math.hypot(SLANT_HEIGHT, ROOM_LENGTH / 2);
  const lightRoom = new THREE.Group();

  const roofFront = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(ROOM_WIDTH, ROOF_LENGTH),
    wallMaterial
  );
  roofFront.rotation.x = Math.PI / 2 - ROOF_ANGLE;
  roofFront.position.set(0, LIGHT_ROOM_HEIGHT + SLANT_HEIGHT / 2, -500 + ROOM_LENGTH / 4);
  lightRoom.add(roofFront);

  const roofBack = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(ROOM_WIDTH, ROOF_LENGTH),
    wallMaterial
  );
  roofBack.rotation.x = Math.PI / 2 + ROOF_ANGLE;
  roofBack.position.set(0, LIGHT_ROOM_HEIGHT + SLANT_HEIGHT / 2, -500 + ROOM_LENGTH * 3 / 4);
  lightRoom.add(roofBack);

  const backWall = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(ROOM_WIDTH, LIGHT_ROOM_HEIGHT),
    wallMaterial
  );
  backWall.rotation.y = Math.PI;
  backWall.position.set(0, LIGHT_ROOM_HEIGHT / 2, -500 + ROOM_LENGTH);
  lightRoom.add(backWall);

  const leftWall = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(ROOM_LENGTH, LIGHT_ROOM_HEIGHT + SLANT_HEIGHT),
    wallMaterial
  );
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-ROOM_WIDTH / 2, (LIGHT_ROOM_HEIGHT + SLANT_HEIGHT) / 2, -500 + ROOM_LENGTH / 2);
  lightRoom.add(leftWall);

  const DOOR_TUNNEL_HEIGHT = 60;
  const DOOR_TUNNEL_PADDING = 30;
  const DOOR_TUNNEL_WIDTH = 100;
  const rightWall = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(ROOM_LENGTH, LIGHT_ROOM_HEIGHT + SLANT_HEIGHT),
    wallMaterial
  );
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(ROOM_WIDTH / 2, (LIGHT_ROOM_HEIGHT + SLANT_HEIGHT) / 2, -500 + ROOM_LENGTH / 2);
  lightRoom.add(rightWall);

  objectLoader.load('./models/gym-light-on.json', model => {
    model.scale.multiplyScalar(3);
    for (let x = -200; x <= 200; x += 50) {
      for (let z = 75; x <= 125; x += 50) {
        //
      }
    }
    // [[-15, -480], [-20, -480], [-25, -480]].forEach(([x, z]) => {
    //   const light = model.clone();
    //   light.position.set(0, LIGHT_ROOM_HEIGHT + SLANT_HEIGHT, -500 + ROOM_LENGTH / 2);
    //   lightRoom.add(light);
    // });
    const light = model.clone();
    light.position.set(0, LIGHT_ROOM_HEIGHT + SLANT_HEIGHT, -500 + ROOM_LENGTH / 2);
    lightRoom.add(light);
  });

  return lightRoom;
}
