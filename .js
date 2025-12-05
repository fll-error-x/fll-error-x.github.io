
nextRain = Date.now() + 30000
rain = false
queue = {}
seconds = -10
owners = {
	"TPS5": ["Coder", "Main Owner"], 
	"Bloxd_Zetta": ["Builder", "Second Owner"], 
    "MichiJuanBloxd": ["Tier Tester"],
"Emperor_Krishna": ["Helper", "Third Owner"],
	"suzix": ["Moderator"],
	"_Not_pro_gamer_YT_OP": ["Moderator"],
	"S0MPENDER_2nd": ["Builder"],
	"MRGAMER92": ["Helper"]
}
moderators = {
}
savesLoaded = {}

let tpos = [33, -1000, -29]
let showDrops = [
	{
		pos: [28.5, -1000, -28.5],
		name: "Gold Spade"
	},
	{
		pos: [33.5, -1000, -28.5],
		name: "Gold Spade"
	},
	{
		pos: [33.5, -1000, -16.5],
		name: "Gold Coin"
	}
]

INFO = {icon: "info-circle", style: {color: "magenta"}}
TEXT = {color: "aqua"}; NUMBER = {color: "lime"}
api.setMaxPlayers(40, 40)

function playerCommand(p, cmd)
{
	cmd = cmd.split(" ")
	return Server.parseCommand?.(p, cmd)
}
gsave = {}

for(const m of api.getMobIds()) api.despawnMob(m)

_3d_text_mob = null
nullScaling = {}
for(const n of ["TorsoNode","HeadMesh","ArmRightMesh","ArmLeftMesh","LegLeftMesh","LegRightMesh"])
{
	nullScaling[n] = [0,0,0]
}
saves = {}
bpi = {}
operations = new Set()
Server = {
	codePositions: [
		[0, -1008, 0], [0, -1007, 0], [2, -1008, -2],[2, -1007, -2],[2, -1006, -2],[5, -1008, -4], 
		[5, -1007, -4], [2, -1008, -4], [2, -1007, -4],[2, -1008, -6], [-3, -1008, 0], [-3, -1007, 0], [-5, -1004, -9]
	],
	persistentSavePos: [-5, -1007, -9],
	codeLoaderIdx: 0,
	loaderErrors: [],
	initDone: false,
	initLogDone: false,

	dataLoadDone: false,
	textSigns: [
		{
			pos:  [5.5, -998, 3.5],
			content: (t) => {
				for(const p of api.getPlayerIds())
				{
					api.setOtherEntitySetting(p, t.id, "nameTagInfo", {content: [{str: "🔥 Best Killstreak: " + saves[p].maxKillstreak}]})
				}
			},
			id: null
		},
		{
			pos:  [5.5, -999, 3.5],
			content: (t) => {
					let bestPlayer = api.getPlayerIds().sort((a,b) => saves[b].maxKillstreak - saves[a].maxKillstreak)[0]
					let allTime = gsave.killstreak ?? {name: "---", value: 0}
					api.setTargetedPlayerSettingForEveryone(t.id,"nameTagInfo", 
						{content: [
							{str: "🔥 Lobby Best Killstreak: " + 
							saves[bestPlayer].maxKillstreak + " (" + api.getEntityName(bestPlayer) + ")"}],
						subtitle: [{str: "🔥 All Time Best Killstreak: " + allTime.value + " (" + allTime.name + ")", style: {fontSize: "45px"}}], subtitleBackgroundColor: "#22283b"}, true)
				
			},
			id: null
		},
	]
}
var maxHeight = {},
    minHeight = -1e6;

ticks = 0
function tick(i) {
	ticks++
	Server.rainTick?.()
	api.getPlayerIds().filter(p => !savesLoaded[p]).forEach(p => onPlayerJoin(p))
	let codePos = Server.codePositions[Server.codeLoaderIdx]
	for(let o of operations)
	try{o.func?.(o)}catch(e){operations.delete(o); throw e}
	api.getBlock(0, 0, 0)
	if(ticks % 30 == 0)
	for(const t of Server.textSigns)
	{
		if(t.id && api.getMobIds().includes(t.id))
		{
			if(ticks % 3 == 0) api.scalePlayerMeshNodes(t.id, nullScaling)
			api.setPosition(t.id, t.pos)
			try{t.content(t)}catch(e){}
			
		}
		else
		{
			if(api.isBlockInLoadedChunk(...t.pos))
			{
				
					let id = api.attemptSpawnMob("Draugr Zombie", 10.5, -999, 3.5, 
						{name: " "})
					if(id)
					{
						api.setMobSetting(id, "walkingSpeedMultiplier", 0)
						api.setMobSetting(id, "runningSpeedMultiplier", 0)
						api.setMobSetting(id, "attackRadius", 0)
						api.setMobSetting(id, "idleSound", "")
						
						t.id = id
					}
			}
		}
	}

	if(!Server.dataLoadDone && api.getBlock(...Server.persistentSavePos) != "Unloaded")
	{
		gsave = JSON.parse(api.getBlockData(...Server.persistentSavePos)?.persisted?.shared?.text ?? "{}")
		Server.dataLoadDone = true
	}
	if(!Server.initDone && api.getBlock(...codePos) != "Unloaded")
	{
		if(api.getBlock(...codePos) == "Code Block")
		{
			try {eval(api.getBlockData(...codePos).persisted.shared.text)}
			catch(e)
			{
				Server.loaderErrors.push(e)
			}
			Server.codeLoaderIdx += 1
			Server.initDone = !Server.codePositions[Server.codeLoaderIdx]
		}
	}

	if(Server.initDone && !Server.initLogDone)
	{
		let errors = Server.loaderErrors
		
			api.broadcastMessage([
				{str: "LOADED ALL CODES", style:{color:"aqua",fontSize: "25px"}}, 	
				{str: errors.length > 0 ? "\nErrors occured:\n " : "\nNo errors occured", style: {color: errors.length > 0 ? "red" : "lime"}},
				{str: errors.join("\n "), style: {color: "red"}}
			])
		Server.initLogDone = true
		
	}
	if(ticks % 40 == 0)
	{
		Server.onSecond?.()
	}
	if(ticks % 3 == 0)
    for (const i of api.getPlayerIds())
	{
		if(!Number.isFinite(api.getHealth(i))) api.setHealth(i, 100)
		let pos = api.getPosition(i)
        if (0 === api.getBlockTypesPlayerStandingOn(i).length) {
            let e = pos[1];
            e > maxHeight[i] && (maxHeight[i] = e);
        } else maxHeight[i] = minHeight;
	}
	if(Server.initDone)
	Server?.tick?.(50)
}
function onPlayerDamagingOtherPlayer(i, e, t) {
	if(api.getClientOption(i, "creative") || api.getEffects(e).includes("Invincible")) return "preventDamage"
	if(api.isInsideRect(api.getPosition(i), [-51, -1002, -51], [51, -500, 51]))
	return "preventDamage"
    var n,
        a = 0,
        l = api.getHeldItem(i);
	if(l?.name == "Stone Hoe")
		{
			if(Math.random() < 0.2)
			api.applyEffect(i, "Health Regen", 5000, {inbuiltLevel: 2})
		}
		
    if ("Moonstone Axe" === l?.name) {
        let s = maceDmg(i, 0);
        n = s < t ? t : Math.floor(s);
        let o = l?.attributes?.customDescription;
		
        if (o) {
            let e = o.split("\n");
			
            if (e.find((i) => i.includes("Wind Burst")) && n != t) {
                let t = e.find((i) => i.includes("Wind Burst")).split(" "),
                    n = romanToDecimal(t[2]);
				let v = api.getVelocity(i)
                api.setVelocity(i, v[0], 9 + 6 * n, v[2]), windParticles(api.getPosition(i));
            }
			
            if (e.find((i) => i.includes("Density")) && n != t) {
                let t = e.find((i) => i.includes("Density")).split(" "),
                    l = romanToDecimal(t[1]);
                (n = maceDmg(i, l)), (a += l);
            }
        }
		api.setOtherEntitySetting(i, e, "hasPriorityNametag", true)
		if(api.getHealth(e) - n <= 0 && api.getEffects(e).includes("Totem"))
		{
			api.setHealth(e, 10)
			api.applyEffect(e, "Health Regen", 10000, {inbuiltLevel: 8})
			api.applyEffect(e, "Damage Reduction", 4000, {inbuiltLevel: 8})
			api.applyEffect(e, "Invincible", 1000, {icon: "Iron Chestplate", displayName: "Protection"})
			maceParticles(api.getPosition(e), a), bpi.broadcastCustomSound("maceHit", 1, 1, {playerIdOrPos: e}),api.applyEffect(e, "Slowness", 3e3, { inbuiltLevel: 2 })
			totem(...api.getPosition(e), e, i)
			bpi.broadcastCustomSound("totemPop", 1, 1, {playerIdOrPos: e})
			api.removeEffect(e, "Totem")
			return 0
		}
		maxHeight[e] = api.getPosition(e)[1]
		
        return (
            n != t && (maceParticles(api.getPosition(e), a), bpi.broadcastCustomSound("maceHit", 1, 1, {playerIdOrPos: e}),api.applyEffect(e, "Slowness", 3e3, { inbuiltLevel: 2 }),  api.applyImpulse(e, 0, -15, 0)),
            n
        );
    }
	if(api.getHealth(e) - t <= 0 && api.getEffects(e).includes("Totem"))
		{
			api.setHealth(e, 10)
			api.applyEffect(e, "Health Regen", 10000, {inbuiltLevel: 8})
			api.applyEffect(e, "Damage Reduction", 9000, {inbuiltLevel: 8})
			api.applyEffect(e, "Invincible", 1000, {icon: "Iron Chestplate", displayName: "Protection"})
			totem(...api.getPosition(e), e, i)
			bpi.broadcastCustomSound("totemPop", 1, 1, {playerIdOrPos: e})
			api.removeEffect(e, "Totem")
			return 0
		}
}
onPlayerDamagingMob = onPlayerDamagingOtherPlayer
function maceDmg(e, i = 0) {
    return 39.375 * (maxHeight[e] - api.getPosition(e)[1] + 0.5 * i) * 0.1;
}
function maceParticles(e, i = 0) {
    let [t, o, a] = e;
    (o += 0.5),
        api.playParticleEffect({
            dir1: [-1, -1, -1],
            dir2: [1, 1, 1],
            pos1: [t, o, a],
            pos2: [t + 1, o + 1, a + 1],
            texture: "square_particle",
            minLifeTime: 0.7,
            maxLifeTime: 3,
            minEmitPower: 6,
            maxEmitPower: 6.5,
            minSize: 0.078,
            maxSize: 0.15,
            manualEmitCount: 100 * (1 + i),
            gravity: [0, -3, 0],
            colorGradients: [{ timeFraction: 0, minColor: [153, 67, 0, 1], maxColor: [130, 50, 0, 0.4] }],
            velocityGradients: [{ timeFraction: 0, factor: 1, factor2: 1 }],
            blendMode: 1,
        });
}
function windParticles(e) {
    let [i, t, o] = e;
    (t += 0.5),
        api.playParticleEffect({
            dir1: [-1, -1, -1],
            dir2: [1, 1, 1],
            pos1: [i - .5, t -.5, o-.5],
            pos2: [i + .5, t + .5, o + .5],
            texture: "generic_2",
            minLifeTime: 0.2,
            maxLifeTime: 0.4,
            minEmitPower: 7,
            maxEmitPower: 8,
            minSize: 0.4,
            maxSize: 0.5,
            manualEmitCount: 100,
            gravity: [0, -3, 0],
            colorGradients: [{ timeFraction: 0, minColor: [255, 255, 255, 1], maxColor: [255, 255, 255, 0.8] },{ timeFraction: 1, minColor: [255, 255, 255, 0], maxColor: [255, 255, 255, 0] }],
            velocityGradients: [{ timeFraction: 0, factor: 1, factor2: 1 }],
            blendMode: 1,
        });
}
function romanToDecimal(e) {
    const i = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1e3 };
    let t = 0,
        o = 0;
    for (let a = e.length - 1; a >= 0; a--) {
        let n = i[e[a]];
        n < o ? (t -= n) : (t += n), (o = n);
    }
    return t;
}
function getMace(e, i, t) {
    (windBurst = i > 0 ? "Wind Burst " + decimalToRoman(i) + "\n" : ""),
        (density = t > 0 ? "Density " + decimalToRoman(t) : ""),
        api.giveItem(e, "Moonstone Axe", null, {
            customDisplayName: "Mace",
            customDescription: windBurst + density,
			customAttributes:  {enchantmentTier: "Tier 5"}
        });
}
function decimalToRoman(e) {
    const i = [
        { value: 1e3, symbol: "M" },
        { value: 900, symbol: "CM" },
        { value: 500, symbol: "D" },
        { value: 400, symbol: "CD" },
        { value: 100, symbol: "C" },
        { value: 90, symbol: "XC" },
        { value: 50, symbol: "L" },
        { value: 40, symbol: "XL" },
        { value: 10, symbol: "X" },
        { value: 9, symbol: "IX" },
        { value: 5, symbol: "V" },
        { value: 4, symbol: "IV" },
        { value: 1, symbol: "I" },
    ];
    let t = "";
    for (let o = 0; o < i.length; o++) for (; e >= i[o].value; ) (t += i[o].symbol), (e -= i[o].value);
    return t;
}
api.log("World code callbacks go here!");


function onPlayerAltAction(p, x, y,z)
{
	let held = api.getHeldItem(p)
	if(held?.name == "Gold Spade" && !api.getEffects(p).includes("Totem")) 
	{
		api.applyEffect(p, "Totem", null, 
			{icon: "Gold Spade", displayName: "Totem"})
		api.setItemSlot(p, api.getSelectedInventorySlotI(p), "Air")
	}
	if(held?.name == "Iron Fragment" && !api.getEffects(p).includes("Wind Charge Cooldown"))
	{
		if(x != null)
		{
			let force = api.calcExplosionForce(p,0,0.04,3,[x+.5, y+.5, z+.5],true).force
			api.applyImpulse(p, ...force)
			windParticles([x+.5,y+.5,z+.5])
			api.applyEffect(p, "Wind Charge Cooldown", 1500, {icon: "Iron Fragment", displayName: "Wind Charge Cooldown"})
			bpi.broadcastCustomSound("windCharge", 1, 1, {playerIdOrPos: [x,y,z]})
		}
	}
}

function onPlayerJoin(p)
{
	if(!api.getEffects(p).includes("MPVP"))
	{
		api.setPosition(p, 0.5, -1000, 0.5)
	}
	api.setClientOption(p, "canCraft", false)
	api.setClientOption(p, "maxAuraLevel", 0)
	api.applyEffect(p, "MPVP", null, {icon: "Moonstone Axe", displayName: "THE #1 MACE PVP SERVER"})
	api.getEffects(p).filter(e => e.includes("Auto Warning")).forEach(e => api.removeEffect(p, e))
	api.setClientOption(p, "canSeeNametagsThroughWalls", false)
	if(api.getBlock(0,0,0) == "Unloaded") api.setPosition(p, 0.5, -1000, 0.5)
	api.setWalkThroughType(p, "Purple Portal", false)
	api.setWalkThroughType(p, "Orange Portal", false)
	api.setWalkThroughType(p, "Yellow Portal", false)
	api.setWalkThroughType(p, "Light Blue Portal", false)
	api.setWalkThroughType(p, "Magenta Portal", false)
	saves[p] = JSON.parse(api.getMoonstoneChestItemSlot(p, 0)?.attributes?.customDescription ?? "{}")
	api.setClientOption(p, "lobbyLeaderboardInfo", {
		rank: {displayName: "⭐ Rank", sortPriority: 0},
		name: {displayName: "Name", sortPriority: 1},
		coins: {displayName: "🪙 Coins", sortPriority: 2},
		gems: {displayName: "💎 Gems", sortPriority: 3},
		kills: {displayName: "⚔️ Kills", sortPriority: 4},
		deaths: {displayName: "💀 Deaths", sortPriority: 5},
		killstreak: {displayName: "🔥 Killstreak", sortPriority: 6},
	})
	saves[p].totemAmount ??= 6
	saves[p].maxKillstreak ??= 0
	saves[p].gems ??= 0
	saves[p].dct ??= 0
	saves[p].usedCodes ??= []
	if(!saves[p].hasRankUpdate6) 
	{
		saves[p].rank = null
		saves[p].hasRankUpdate6 = true
		delete saves[p].hasRankUpdate2
		delete saves[p].hasRankUpdate3
		delete saves[p].hasRankUpdate4
		delete saves[p].hasRankUpdate5
	}
	saves[p].rank ??= {name: "Beginner", idx: -1}
	if(saves[p].rank.windBurstLevel < 3) saves[p].rank.windBurstLevel = 3
	saves[p].customRanks ??= []
	saves[p].sidebar ??= true
	if(saves[p].maxKillstreak > (gsave.killstreak?.value ?? 0))
	{
		gsave.killstreak = {name: api.getEntityName(p), value: saves[p].maxKillstreak > api.getCurrentKillstreak(p) ? saves[p].maxKillstreak : api.getCurrentKillstreak(p)}
	}
	api.setClientOption(p, "flySpeedMultiplier", 2)
	api.setClientOption(p, "autoRespawn",true)
	api.setClientOption(p, "secsToRespawn", 0)
	operations.add({p: p, func: (t) => Server.initDone && (Server.checkForRank(t.p) & operation.delete(t))})
	operations.add({func: (t) => Server.initDone && (Server.weather(p, rain ? "rain" : "clear") & operations.delete(t))})
	savesLoaded[p] = true
}
function onPlayerLeave(p)
{
	if(saves[p].maxKillstreak)
	api.setMoonstoneChestItemSlot(p, 0, "Chest", 1, {customDescription: JSON.stringify(saves[p])})
	delete saves[p]
}
function doPeriodicSave()
{
	for(const p of api.getPlayerIds()) if(saves[p].maxKillstreak) api.setMoonstoneChestItemSlot(p, 0, "Chest", 1, {customDescription: JSON.stringify(saves[p])})
	operations.add({func: (t) => {
		if(api.getBlock(...Server.persistentSavePos) != "Unloaded") 
		{
			api.setBlockData(...Server.persistentSavePos, {persisted: {shared: {text: JSON.stringify(gsave)}}})
			operations.delete(t)
		}
	}})
}

function onPlayerKilledOtherPlayer(p,o)
{
	
	Server.onKill?.(p,o)
}
function onPlayerChangeBlock(p, x, y, z, f, t)
{

	if(f == t && f == "Code Block")
	{

		if(Server.codePositions.find(e => e[0] == x && e[1] == y && e[2] == z))
		{
			Server.codeLoaderIdx = 0;
			Server.loaderErrors = [];
			Server.initDone = false;
			Server.initLogDone = false;
		}
	}
	else if(!api.getClientOption(p, "creative")) return "preventChange"
}
function onPlayerDropItem(p)
{
	return "preventDrop"
}
function onPlayerChat(p, msg)
{
	return Server.onChat(p, msg)
}
function onPlayerClick(p, isAlt)
{
	if(!isAlt && api.getHeldItem(p)?.name == "Iron Hang Glider")
	{
		let v = parseInt(api.getEffects(p).find(e => e.includes("Auto Warning"))?.slice(13) ?? "0")
		if(!saves[p].sendAuto) api.sendMessage(p, "Auto Clicking or continous spam clicking (even at under 20cps) is prohibited. (Spamming is allowed while holding the mace.) If you are not auto-clicking (this can make some false detects), you can diable this message via /toggleautowarning.", {color: "red"})
		api.removeEffect(p, "Auto Warning " + v)
		api.applyEffect(p, "Auto Warning " + (++v), 5000, {icon: "Red Concrete", displayName: "AntiCheat Warning " + v + "/20"})
		if(v >= 20) api.kickPlayer(p, "The anti-cheat detected an auto clicker. This can also happen if you are spamming continuosly. Please disable your auto clicker before rejoining.")
	}
}
random = (a) => a[Math.floor(Math.random() * a.length)]
onPlayerFinishChargingItem = (p, d, i, t) => Server.tridentFinish(p, d, i, t)