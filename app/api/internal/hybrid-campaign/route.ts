import { createHash, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { LAUNCH_CAMPAIGN, launchClickUrlFor, type LaunchVariant } from "@/lib/email/campaign-tracking";
import { renderNextLaunchIteration } from "@/lib/email/hybrid-email";
import { decodeUnsubscribeToken } from "@/lib/email/unsubscribe-token";
import { sendProductEmail, unsubscribeUrlFor } from "@/lib/email/product-email";
import { filterSuppressed } from "@/lib/email/suppression";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
const HASHES = new Set(["bd1c8d686686bedb85ead547cfeebb6b030420e92f1b45304bf6839c407b44d5","f2538aa2c50b347c373a7e1ef7c6ee1e233b04071aa860c2310e7c9525c9a23f","377dfe6cd070e2c188fdf08ee74edb2bdd75bf6f4eecf3544f251fad79ae8e7c","a81c6d1735b693b13796705ad619971c01a21d71aff221864b62e715a060c108","fd39cd209289a2496a6288428aa9e29c53f96725afc6b66a255eaeca451564c3","7af1aa5f7c29dbc7743f5b0f6f61f23cfe4129d27183e029fe4f8f8e3be2c0f4","029877e4c4794a767a35364bc77ed3cc0ad2ed059400b66b4d1fdda8b97282d3","c03e133d0257a8b98b25af33727de8da0bbf55549a074999e891f41cd1d41802","786638376a8a7ff4a901750ceacdff8bbaf4f0f52514b2a71cd305c064055e58","29005cd9683bae3dd2ffae8cd84e19a9a163e8b00620dbf655b2457d3e5f46aa","059cd57cd61f0435e4628b839884e91f38436d20418a3daf7477a5fa98ddb26b","e2278970af215fde2e01e9d880647b7f69d25b38bc85e64097d09f65158eddd2","998e6c76090c508c676ce0d5265b9738fd6b9d387d37ade01b6b56b2104a0e1c","ae376692ee922c544663546b3cb4dc5a7c5cbb0f5738e04c163f4fc68cc95e38","fcb83481645e6750c26bfc3f5d5bb0fc256e4f3da532f7950ebcd5eaa517ecd3","bb890c7971366615db998bbd124190e1ff02c0da617383a2c09c6de10c0f8ae2","e17c13dce2431aa25fa90f89aeae0eb21eb3242746dac71b27c17d5bc6e903c0","8760be5e516bfa3e36dd2f62bbc522a22e7b15430249973b7fd364dbc0db5e7f","1b6dd84502d66bd3b0e182312a01f19e1f3bfd781868003a64f522f0cb8e9d84","16bbd93c000424ef29fe955f4675e144b9ec3e42438ccbc1b585388628bdfe8a","e69d27c93b7bdde46c54441487679862fd039e8313e4b5b705b5f0bfef128f2d","f449a8d4d297185241f62cf5a6ab7ab866ae1fa56c03c33d3c7fea52b19d8685","80d6678afa58038dee8a47aa01cf7faa37ff641f995fd7e14650de35fbdbbe2c","976c08cd7219f5736adbcf1b286eaac528bce7015928b0b459c0eaabeff39a58","d5345cdbd21b9d8ae2ffb8529b2f3e40e5a72d0ae482556e81809fcb0f2f9954","a86b4b94c8229d2a8a749cbf28c6c30235d6b3e9beaf38892a45c4a4cccf1771","ec59f84bab6acbbd91c04d15138714339ed5781447c82de96700cd558c1439d2","60756d89c9d8383a4c5f1d990e1ed8dc53bab264f6cfaab28440ce3b45cf8a65","e43fb07d59c9922421b1aad4ed14c53e87dab27586adfb763ace49ff29a5168b","4d4bc9f8e1297ed19faa9f27fa4a3ca50220bb18a38326506a8f6d2a6077e68c","548ea1c4f6d6b75a4bf552f04b78a460964fbffcbfad29cf8415fa34b4b09bc3","aa8e640ba5bbd62d2672c5fec3fe8e9cb810bcfb403706bf1ef4c7f30d87cb91","9d5e8c586f53c2be445ad853ac51b683e3ad6b12d46201093d350205061aeb34","40a4824c36c7c5eb605151d0f919d907ba1dbde5fc255145a59d5baa6bcb7d68","5b203375eadfb4be617b766237d720488190f3e1db36d6da8fc1854bcefdb275","d327181bf50facfce48a9e6ad1a5f4c9e3f9a7444f70d893d651417ffc0f0605","1ecf018be17c2315abeb0d57964f9a690964c14fde515e8086045af8f88d6706","a4a48316a7f9623d307e9fb4589660a5a3171fc9ff6597117eb9e032d69e9df5","0e8b27df22c5f4db8c06f472654c164ae4036dc1a11dc8f39b251e85f68d7229","33735e8338440966bd649136ff140c9b58a279ed5c0367b1ebb223e50732b3ed","9a1625107fed1af6228c526c84b37aa9133ca533eacdaf79cc2c9468866152e6","794ee26b75146b7512bd9da9128d5ab3a31f06d0720dd2a22cd568aab7fe4475","e5689f8822fd7191a5ea17b2d24efe2930d4f223b11d4ec346a24666445e2cc6","766d02a438e0c471b47bf9140387b59ef038e189285eea5130999a811f1c42e3","69917e2a6931b3c5c5c60290fbdbd5237d6991cb811ed6f6716775ff40fc00a7","93aade1716add26a77e0883f1e32fcc68af9f1eeddf57339dd5f4fa8bbaff544","6dddc605c0b9ed39db5683da254951789eedec2391c7c98950f05e3b92b098a1","1a5f1f92e63817fe57ead1fe0171556ca98035ad6843ff79ce6b0969e68301d3","308ad6c630688d0c775a0a717232fc011b00f1e301de604c4e910171baf79d81","db26e440196836a2028b477263626686e5fd95fe4f64cad8894ea5b972c6f009","a5f288eb570993001d5a778ea7af03484aadb710a83bd59d4c6314496e1f843c","933614efd1e908dc77d9620748a4d87fbd7e5f0375d8135037ec0eb6ceba032a","d0097b80186e82773b4c66a28d16b994ec8abc17af3216cc10d3dd3b6175c977","55a4db7e8354ff878f0b734d3b75a12d48cffa99cf26df650ff824563c8da358","9fb79e194d368c5e804e3755a8bb1bbd17797d15822302333cac991cc4dcee9e","615f80e718ee99ffc474d31959e31a76d1d1805b8ebe3ef1879b8299a41eed20","22e40a62601a74c175f97ce4acd2c5d38441af956e7bd9aff4875564f107c382","b311541e116ed263b203e8e51db0ef5a34f6a65b34521507d54294e02abc975b","c440f3696aa7d0b6be0beb2d1025845fbfda94aa666018e0e0c32855dc7fbb0f","98f864ac0c2ba5f0a6921daa16e27651c9c97afe9bd38e5e713d1d7c92c82d7d","4a6d1214a4a5120235020c27727764bd2b25df575cd0994e0ee05e7d7e241448","41544cf23bd2d93aec04a0ef4ca14957c7c6a67776b102919ca6087796eb0b50","950e0a46ebb82b71dd98237c659297f215eb5e8ec3ade2237aa0db161d3afbb7","e6e39c9c3d3c0c715b95451a49ee2a78ac246a4f45105a4633147263d0b319e6","b635b249b8915e97c0b258a81023672d5ff0666d5154709abc7e33f4e452efb8","407494cbcc0f4fca127e14d709567dc09dc34bb539380d491f0d50fdf7f8839c","9b4e884ed3cfd46bd6070f11143f5809dacc804916638c97fa951afa1790fb95","619cc72260bd0a5606d45d7bf0f7edd89511395089c23b0968c91b593dcd29ca","33c732b95fd80d9590845bb193076c5a3224bfe611c1266f04b5cab61791038c","ea6ad7c5b798cbebcb1c3c996a8b26d11821fb6caf6b4285d46fc42b3c31034e","0efc36a266a943778587163f657e43b69f2b48d3c23b981c1ec9ac28d900df54","8095e7fc2497580238c3760926b15534551dde9475ffef83987e55ea472f7cf0","4b21b507bfd1b74deb527719537491de6dec70442754186b1b961abee1d1ed0b","eb977cf649f55039fd0b8432226c03999690bd2f52e64422417c29c8ca49dad0","b775bf34021afb056a421984a7479044a2fb8b5a9e06cfcec6debc4170bd0e8a","17e33d4ec9a52479010f705f19e06a922b6c064df1429020247529f0de769f65","31a8cea5145dfca93146efd65282c44dd37336b38fd21334a1a3d8ff60374f2a","51e8e3de5a3d677233e8d332ec785e35e5eb506d0113f209317e431c7fe6b76c","d7165cf7be2c39e8541c0845e3b3628709ecc9f7a3c5bc23e9435e3dde254c7e","acc4d3dcad25d6b5e05eb91dfeb0eea8a22daa235cfbff9f571a1db3372552e7","c6a52094e6c118c0ef695f4d0ea15f3bb43ac43632cd238d673b5a07279d1f89","c957bca43cfd0d274aeebfb6380caea164774f06ad6e678fd10b0023801fabad","19a962a7a3e0b6ec307615edf856cc7ac8300360ae4590603f0c1681ab9fde88","6560267746362a081ecb7ca9f3c5e31026224c46dfa5cb841815c03f835a9882","11a16fca51e931deda98b091ce044571222ffa275cdd65572718259b3ea5b778","267f6cb33944f43dfa0716c5f798999c9877c7e1389aa964c66f3138ed84d926","9c58a903cd474e7ed9f4e82bf633a9e66f34fa2edb482b432ef7da684040041a","9cd4ac06cd88748f4606027809dc59bfe8f1280b5d984ce0683179f7f6b25795","b38db52e9eb4519ea28d394714f8a82742404bee53e9e5fb538b149dd08c9dfe","c401d9a57a33dde0ac1293512f399693f2d4045764b0cc4e705a3942b514a737","2b5f4a3592bc91764c4a148746a6371a8af176e6abac569396824ace941a30d2","106a787ed129a1e952fe8b8c0683d61fe896cfa084318ecab60671e11e56b8f1","41f47528d6f256ed3d7902dccb8b52b1172909785bc76a23857be63cc1224783","704f571b208f17ba1e46d76097ab7b709d890b3d77a2277aa3523d4d04982591","9e9f9004a136184edca87a78601e2423d80e3b8f179c550da5be9fb6da92d4a5","96a6b2bc42e08889367d5ebf153788a4596737e97400dbc08276a8d489b270da","dfe53b6010ebd51b8359183082d771d952dd42066515f64bc9ae4f84bc424f2e","f4dd80a9da86cead93fbaefa6ac6fb95dae0a41f0657b7b783c93d1446b2c46c","756775445ae520504ae66c84b573de59fbb1f53fc8748da89b769b2c18c43bdf","a10761ebced07b5d06233017df663237f62e214f4da6ac74f440cade371e6f5f","4bb9e3c20f179d354e99f2de4a119fe50ba73671f9ec1b8e3d85aeb84777ab03","ea2ddfa90e620bf2049d54149ffec73ba0317739e9d77da8abb47e7975cb42d6","0694e54ca4c3f906e6b2ae7d84a78efd340f87d2b70c8a1e62a4f794aac94d3c","c8ab64cb947b482be9eab8158df17b152d1268ce0c58003d508279942fd91619","23dd5e2e92d36c198309916e0fdf9b51edd33a243be7e1732488a82c9f1ffe1d","4e10f076079fc8acbce80aecaee5e173a0ff65854f4e7b73db9abb456c41e692","50209248355874933ae4df574896ce977e989704d377da37c1b3d1e78792a6eb","196dd91116cd9cf1f6377bc08cce0339819a86b84d725b848388636351a9443d","864549547d45ce8a1b01e6062a931a8451c9c7f5765e633e658c9af44cea3a94","3b7df1517394ac602781d6ab476be687c7c23df113ad8a79f9be48be57212387","7cdff09d2110223e38b44cabcc0600e3a91b066e84420aa568544100983d95e9","d9367d07675b6f9aa37847731cdab808c23dccfad86d86b5e68e17e6c7edd685","188b555054e8d39e78ac85408a630177e34ec7bf302d805c8eed840b0901da74","655984ed05194364965d66f31053ffb5d9afdd5b66d640fc1d77bb62702ef11b","0d230f3dd4900a9be93b2019e00fef1a3eb6e967d3b9702248fbebbe6c454c56","00a5141a511fd1b6449b064ab2f089fd3fcfb849cd8757e2db66c1d4c79f56fd","77f29bb965cba04e278f1b798db2eeef613f27ca90bfd02323896e84bbe25328","a92ea850ea41b92c0340b0295e5668ad32b5eca87eca8fa5dd13c95a6514344d","b686286613343cf7d209bf000050b826a2fb7fc2c20bd1d07e6b0856f1a7a5f9","c0ccaecc6c7933b926b985b4ae4564bcac3bf1ae8026e64c4d1b58feaea0397b","8e56ddcc4c2bd6c715dd4a3f1cd07968a427f39a7c9d518b3ca7f30815fa0182","6822b60563175680995d6fc49d1a42a2a6c881956e8c2d834b1aad32334e7a56","0aac23399c93f3902e1111b26569f8fa2eb2f4f1781dcf4ce241fa5d46151625","dc717b0be93923be5ed790f560cc37ad4c687326fb5f69dd95a0bc2f7f88e675","8b3212d6c86d29f50c470c88b6bbd9fa44f40ff57b999cf10e53699465195a7a","3e8ddc7715cc9a979f19e28db36a3327139ff71a8b5332acbddd1adbdabeb2e8","2e89ee830fb0c0a6f05596fe569d546065fe96161c10ec5583db103fb73b1887","817da07ce338446bbc3a3b17205ce04cdb0c0f6744c5e596437edcc8df1a9253","0370b14cc30f7d89e84d07b9dfa193f159c12901a8a4aed7e91b17dc8ca309c0","fa3b2ca00ad79dee689da84055b7db82283153369d0a2d08d8f05dac85237792","77aee56c014a482983c1bb476049d51326d5c1243e664b36cbc2f4991728da9f","bfcbaf3185bac6f9747cd160f5767597f59c2ea11eafa18f33574a96b32477b4","81cac3f0e5f8aba11b297663c58220cd820ac4962da1959797dd38622ae043f6","6e1eee07080d588fce9dfe0d10e8c4aed7f80f2a864513ec7b789e8652a2c312","7eb8880e2900ab02bf395a297882e3a6b91a14193fb16894ac1fb42f8e19703e","80644ecacb99cb43d81bb189fb07f6db92b9d39adf5c2aac77fa7c2faa5019b8","a4d054906929c5ecfaf04e18d2be0c220eae9fdc1fd52d1950a334b64689dd23","0afed0db1d61a4bb122911cc1ff97bf6cbb659675d54747cda92cf09ae3b21c4","5d8b0e8c11e5e025a966b4626396909f2d4630b62e0ba3e7ecb927c8a8fb2905","baccfe595ce5cbc36e2643f3609fd6fd86e645d2aa91c4061a85c604f3dcfc53","0e44890ccf0a395d0ef0058778bb6020699c63385884915c29bcd8cb2bf4692a","5bd4da180370f225fde98e9b39b4ea956c6503e232061c420beee6c470c181a6","4b64dd8be5f35b12aabc3c6e96d447974c7802c09c3c87c2922f15546e17e846","01339030a8f0454f2a019d2c080da5a782524fc1450b9462b034eb21022b325d","13294eb518816c040c1b78dbd645bf826414770a97c0c53095b8cff6c740fb4e","60a5167811ca9968b38e7a27f1e1755d609a2467f1db498b8b48b51685165523","8de3ffe6f73a1adbbd62312bbbc8a162af27f450e8f4bab33673441ca15d0e8f","3901558a6de8bea9710ea1c878e214737493e1f51f616ad6bfb15f767f497645","8b180f212fc09023f6ee57b36805b45943671535f3a294751ea6d5e0398ad53e","571a111cec12bfcd3eb088c26bddc5f5933aed2add8f12e3995fe632395c6749","f600e784588af957edfced5be4fd5a739c80dd93a99d41e572ff1a0af8f08eff","9af0326b7adbcd60d94e20f3711127936a515112ad40455a406d3d4836810a20","ce4d435ac41149539870449f15e9449b88f02f88bb3e6e72b6360c8b0236bad1","f9da96acb64ba9d5d6d6f179ba31e570ee611783fc4cc11ab0f4eb969e1b1230","eb1076472b84bd7cc5da0cccb9d4190a19c24ba4ad4129ebf21170a87e37d241","34983ebbaea6864d7edfb8e27a88c7d532bfd1149a0e87b742062f8d07fc1bc8","deac44f0d07b29b697ce75cd951322b9384bb392701938caa0ad004843ab2522","7ae375074e4dc5b2f8f54b6cad611066f08d06bf6a9d8d2e72ec41c4f1880d43","b80906c40699dfdffd2175563221060d184381883171a921f1be80fd5bb129c7","9934ca8ff31686df452edfb1d3c4eafff3e58299c66cdfe009693307bdae5a6f","56b0a9e0f1792bc0926400bc6f9bf167c38f6bba793b121b4cd705885d25a275","07718caa1472d51e1a9948d37b12c81af080d1e42e21cca4be39516fa4482b66","94544bf604e6f4a22be01ffeb7fe5d3bfc76e464d9d88e0c4abe7edff8599bc3","e9f32ab90e5b4fa9b160ad544182ced5d0647800c7d046c7797e086f7509ce91","d938bf18a01360c03a5442f73b9018fef59fa16d582f9aa411bb76afcbcd1902","6aaba4661fe312caf5041ce8e5d2319d479b92a14a1004652810e68a581c8c39","5958ad58c667d433f736e18e97a8fecb4b8add004033e5b06f89a9d5a71ca989","6028f42f10311c310d8d875a4f8830621a47f3a7d890d01edbbde3559dc7c8cf","ad172822e7e6f342c4e67656dc7474efc0d16b7d0429f7d7d245857cbb343ddb","cf0a5e23fc618252755ade593da02e1d8ab2b5a2c5957c5405b57f9d280898e9","82cf8f05a86c656b444f07b9a89e3f6ca18f352ec931e3d840fc5a2c3219a891","bd482ea02f0f03e87f567b8e5ef1e2b12cfe4be1fd54a5759285a572732134e8","33616a3a0756cc0d829b92ee4488eff4587d348f9a6217b51127e5cbbc23d529","07b6699bd80b15c7dc6abfeae20e3895964a324a25bb368d5189af5141c0b7a1","d3f092c995593061f558e1f566934d789f973b2c4c3e0458eea151e10040d69f","ce01f8c79711d3970dd8cbcc0f8ef52ae309928c58e56e7fa6891bed1ba33469","931db6887e99e098b1d769e99209e49b1458735bb4227de440787b4d109bc61a","e86ae0f4bfc84375547470713658e73c4e98fc9f93b1e0bc22090d48df07f825","050b34001f5969368589ff9d036515f07a0c5d95cd5ec96920114241f465709b","bf3c9b1d6678e5da1c385fc7138531101ba4f7c8d69b360ba713e69ba8766927","172a20a62c9fd0de3131c76e6b522777085b57847564d5dbcf4a400d45deea0e","91d7a14ee2905011a07f7f8b8d32e7edb618240a771b81a4c7320e62ba073035","34051fd6c8776a3b59fd9707e50852a88b21b44c2c3e6740e4f1c116215b1721","7bdab23d209c82cb6e3a96f1bfe06b31437f8890656f92915172c01f43a3a436","70a0beaa021995032e8ef2bc75e39b13f0e845fd8ac2e397d6e3663fc20b87e8","3e519b076581242828f220c7cc7f887278c38629745d9c580c759171151a4ced","0244713858a49752ad64869949d83f154726e37daf103ad99aa11e8563edbeb3","5dd1c77caabe76422a6a4b4fc485551ee7aeaa04da19413e6549df8c3a86470f","76666b3e8d38455deb714b082869d440fbcddc77d8467e5f1d30cd8da792e71b","dbc3111c7aaf1b8c0af174ead49ff8bbee9c8b2b244dc0656ae7c4efa06c7e47","89adf40848358a597518f7ceb1e0ce95f0683ab3bf3f70228301f9a872266086","09c608fd57f9f27a1e9043ebef52d9519023baf55dc61996d3b5bee52dc99449","db2e9234802b22746cfa75d86043137910e2b256d6b2096275cf635b6bc97d27","ff375d16535a8cf11b379f0f479d51c5290ae506ad90d2cd1ee53e09401295de","c3d713386f3024e390d8b50c305ff56f2f5f6e91cf1e3479d434c7c785a6f113","074cbeb0b2d065fa4c9d3e29c8174508845c91b57ada969ba2e4a04677849d51","2584deffdc47a77320324fb2795272d93b706b77ba98f0fb0c8805744d76a5e6","00021456f57fe75d2f78b959a70d73d62448b572aa6609b1d95a956bbc5f1ee6","7d4c7b6f6565768e84c987d5df614ab021af54964ec0840e5cab65d82969b7e2","876c09595179165c11dca1513599b2a7201509216213c735d05255c5d6d01947","b8339ce8f095e70737b7464de83afe531c75ea0b7871d18b8fb20b3bb54da81f","c00517ce6b166ea43fa4f0439460c522a87fe003465734f8fd2644a8e9e7a19b","3c792734d8e3120e0ceab84bf9fb24d9d0a11b8185f10ac05dd249e500beb8e7","6d90e0238c9024dc96b497319b8c591d744574377a4e67f37e00f3ac9bf8ee3b","abbfb98670b912be8faaf0f70c739e4caa14feaa3211b36fa643b7f87b19b6da","1686fdf2f68e70701f02ad930d76dfe27b73a63923e2e39b5fb5ba602b393c0b","643ee7bd48ad362d1ccdc4635469e7d71f681f9ede0bebbe8e414528f51d0f29","9c45350bd12f8729ed72ba59d9356e1c2750545dd7b458c153bc8cfe58282a13","0f4e9e2fe45b482d70456a6d9ff38efdde1853b8484cc810dd2c788c5f138873","6c22d65a8c49c0e52ddaa60ae268ae67cc1f763dae5c8eaae9ccb92014995392","befe573caa92aab8e54a02e16926aafbfe55f2d71123d9e2084be067376b781a","d3c1564b521a3c55ff2c8be90cb033fd7f2bbf429561dcf7a212e295aa71adf4","2bfbbfbaa0f6c00b3bfcaf474b0e043fc5ce7462d24ddd1c712102743c7ed441","72db084cdffe6645ae8995f5d9e5818c3295c8953d8db1e06355d175fafa4f5b","6d9eac9716e66a14c40acbb18b9b41650a23acb4ff7b76b1959f2d87231acff1","feff57dc4a4eff45282916e2882f033da058ba217666dc9c31b38ccb83540f90","a5a45483ca71e31ad2f90ca172f0866afc8f1f326ffe6c355c2aacaa952478a2","87ff4dfd7f11d4cac8caac1bf1b6f1137a9842a8d72a80a84cba178f1032f448","aa567e0f577af25b8e2a7989b36c10f137d90a6abccfe5730cfeddf4f0f8f8cf","4fe45fc465acbe9d9b2982394e7e351796b2dfdf9e3442e1c6cf7a7b700e8a28","d938413d6b812a1a0f579a8f66d2f52e87044b764c8c4cbd21b94582a2c0cc0d","453f40d79b2df8668be74b561ec8c1abd60f808a09ec0f8ad6291dff6da4ac10","caa7ef0b169f4941e6c3d27efed6dff1c12591a9592df2030819c18de668c321","b973078a29d4694466d2762dc61c4c21d84351382a000940c829346c86c75804","91eda8c6d7bf6e84f55a7a81d2b5d161feed4d2a2db34ab1504dd88cdd6e5a01","0691cd359832146452ccc9d3430a2076bbdf53297c5d7b381f5566be6db73b37","7178510f988b2c15d68581f1df575159bb0f9e502fee8db5c3e8db46d39be8b4","ba9bac207f516ac4c486f1d321f044ceaa200b16aa5d0e5c7fab5c2ebfc08ac2","1ae6375ec271e92196dfb82aca4801b8bd32379314511085fddc9a8ff1404af8","3bd2af24f73dba99cc9863fb094d62d69332d2ee0b1af910b5b6a0f967eda7e9","9888c1d9bfaf3a81b5dab12f3cfdd72e5a9cff6f7985f29d0891cec24a0adde1","439ec2a3c4854d86bb2c6be827493680edffa755ec5ceb2d73046c125cabad28","4b8a3a6ca99fd2fd46114c51de0e1ee2037e2432bdc8db253cd18347fd7f7bf4","28422f0d89a796225a07ed252c8519b15705c0199f8ce9ac8eb86918b713587d","1e31c3049d9e0b65d3bc4394e808f3f20215eafadd5addfe79f11553823cb89b","14af56152a266bf52d4571e0b1afb54cb7922da9d9cfc57072388e78b6f17b2b","63f0770c02b756d29294d4f5428a8f67cee32f97550c76f7133880ae696d379e","d8f8540a56ee584958218e1e4e1895250d7e8c63084141f4cf9e434e7507cc0a","5bb4376848177db4824674283ebbc3386d3709d1b8abbaa2628eaa5d089012bd","9b2db749a5d663fc95fe8331475f7b60d207d119402c4f38b844533870f678c2","b15b7c065f6d5749ecc38f9d8086329ca0b6b5214a3324ed326bf27ae6649c8c","2877267c46d7bc519185d9c107790cfe6b81b6278b0b176a3327838c60faa613","9e84a5589be6054978b9c4469493e42dd53113538d5643235bd37a0aaf69c82e","cd73afebdf2aebdcd33b6f4796f6c905accd7ee9031295d5d8cba6341581e77e","8ee21eee5bcb9cec909a78bd4ef11fee9a145d0098e878590c627bc4f8856ad6","c2e003d8c03f9295dc8128d6e39fd82dca3010c1c08fd24d2ced66d2502e789f","6ef832cbbf01c266e665fb009f4639aef7b6bbfd75524588918356afb4fc6ace","9eb51202677f324c658f4bb71e2efb00b81a19d21bfb865052760535dd99acfc","04474ab656aba0d4f52d777bdd5d59ae7e373556d98fd69becb8a0408cf02c7f","51b5294791211745910c2e0c8edde431a431f670afef17b1a8ce77637f0807a9","ff09a6dcdf3a69764581ee3c1b6fbcf3eff4dabc765224eca7a629161c90e3c3","527b27309c3ee2cf9b4bf700c0400221ec5b42bd51bfb70515d24afee3c86079","1401058e8ab692e09a87f2953fb12b47b210fe3c6cc9468c7801b38c424d2c4a","a675261170b18a64ed53fe3a41f245f8bcedeb2a8c574a3cc82a42eb5a3e485f","1c1a85485bbcc513fe00d14582b2b4daa38bee7407846434c6eb4a37e4f6f11f","9f4aac5f52dd4bde96fc3cf290afb6185074136562bf094478afeb17eed903dc","ed9ec974c757e90cef4c0f76f0b2d867e54800413c631357e3d88f6c40e1c042","d6afb9d046f5efcb7c890028048044d405b10950f6bdc8e5e06d5cdb76980d72","71aa3a62a54925aa46254d6da54967ad7003ca76bd022957f016bc6755b86537","49abe88d24f75d7229bca3ad7d27a3393e36738839e8c41fe3b3ddb279dde48c","f93bb509e4aacc88734e7f7361f17512147199dae23d124d5ff54f0464bf50dd","91d98d905aec7a9f57cfaba0422af15afac623e038edef15d853f2c8f62f33c3","8c93407af844ce3b04e6e05806add3498fb88a44fe3c12acc81e8eef3cbc70a2","07118934147175a6e279726e046e8c65fac7a80c059930884908e6805e408c38","7790c7c3c02c6967533fd31a839241f5bc0f24d8d7e529c08833e30cffb2bf01","0934b623ec87fe60b5ddda0d657aeb83da15245119bd6221584a056e1222b504","0740e4c707f5c93aa0201e6f99d1b9e69d2a962f579aefe73226e7cf7ed6b4c6","bd5feb0160d28d86fa432d8978e311463193869a4da244abc50a286df29c6815","43aa251198332ce85c4cc3d68e456eefba5bfc2e29f7bb36c2d3881fdf9a2084","38ec7eb03890ed6fc44fd2e0e4338d2c8a178cadd0ba43503a0ff1b0614b2674","e15c7150b132f8938d5831967b9f771f5562868537396596a91c53f3958c0fac","5dd3905b8f293f480c7a0743d18a806282cb28ff5bc53f4fca9537d5609cec9c","ab467bac422bfd424e207ae783e8c699694bc5a3eeaf8c2d88f7f633e288c962","6197701f0762126d4a5ded46288dfdc71da75ccfa9f5451319a71a9aac301dd8","725def7e49f1fccb3e4abad33683c1652133bf38d9dea41c769052fcff706310","6698cfe70690ebf959f984773e475707adcc4f0cd3d7300ca31c1ca3dd2a4b7f","48920f1d678bfc14bf13dcf833e62caf5e692d243fd973785d2985e65fdc477c","ba3621ebee3ad00fb9c2c9cde6b38c37cdfb5e5ac76cbb69d7e3fb425e4cc20f","fe5a9dd17618a427fc5a9c3638071dc0ebc4b03323788a174dc95934bd5c1cdb","4af10460e6a71700db0788538670b3f58d7f79f748d677d63a8d4c8a46175ed4","e253b14bd7ac1df29bb350ddce1bcc27d0686504ef864e8c2dd120663e036870","0e263b96057fe6dd2cae89a559fee5e6cfb4bd1540abdad91d7517ead0fa5574"]);

const CONFIRMATION = "send-frozen-hybrid-2026-09-05";
const BLOCKED_DOMAINS = [
  "alphaaiengineering.com",
  "alphaai.engineering",
  "gauntlethq.com",
  "resend.dev",
  "example.com",
  "mailinator.com",
  "dnsink.com",
];
const BLOCKED_EMAILS = new Set([
  "kimkhoi2202@gmail.com",
  "khoilam@stanford.edu",
  "graceyan212@gmail.com",
]);

interface Recipient {
  email: string;
  source: "smart-fella-test-parent" | "smart-fella-test-child";
  createdAt: string;
  variant: LaunchVariant;
  recipientId: string;
  idempotencyKey: string;
}

async function providerSuppressions(): Promise<Set<string>> {
  const apiKey = process.env.HYBRID_RESEND_API_KEY?.trim();
  if (!apiKey) throw new Error("Campaign verification key is not configured");
  const blocked = new Set<string>();
  const cursors = new Set<string>();
  let after = "";
  for (;;) {
    const response = await fetch("https://api.resend.com/suppressions?limit=100" + (after ? "&after=" + encodeURIComponent(after) : ""), {
      headers: { authorization: `Bearer ${apiKey}` }, cache: "no-store",
    });
    const data = await response.json().catch(() => null) as {data?: Array<{id?:string;email?:string}>;has_more?:boolean} | null;
    if (!response.ok || !Array.isArray(data?.data)) throw new Error(`Resend suppression lookup failed with ${response.status}`);
    for (const row of data.data) {
      if (typeof row.email !== "string") throw new Error("Malformed suppression entry");
      blocked.add(row.email.trim().toLowerCase());
    }
    if (!data.has_more) return blocked;
    const cursor = data.data.at(-1)?.id;
    if (!cursor || cursors.has(cursor)) throw new Error("Invalid suppression pagination");
    cursors.add(cursor);after=cursor;
  }
}

function authorized(req: Request): boolean {
  const expected = process.env.HYBRID_BATCH_SECRET?.trim();
  const supplied = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!expected || !supplied) return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(supplied);
  return left.length === right.length && timingSafeEqual(left, right);
}

function parseRecipients(value: unknown, action: unknown): Recipient[] | null {
  if (!Array.isArray(value)) return null;
  if (!["preflight", "send"].includes(String(action)) || value.length < 1 || value.length > (action === "send" ? 1 : 500)) return null;

  const recipients: Recipient[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") return null;
    const item = raw as Partial<Recipient>;
    const email = typeof item.email === "string" ? item.email.trim().toLowerCase() : "";
    const domain = email.split("@")[1] ?? "";
    const local = email.split("@")[0] ?? "";
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      BLOCKED_EMAILS.has(email) ||
      BLOCKED_DOMAINS.some((blocked) => domain === blocked || domain.endsWith(`.${blocked}`)) ||
      /(gauntlet|alphaai|alphaaiengineering|smartfella|fartsmella)/i.test(domain) ||
      /(test|qa|smartfella|fartsmella)/i.test(local) ||
      (item.source !== "smart-fella-test-parent" && item.source !== "smart-fella-test-child") ||
      (item.variant !== "a" && item.variant !== "b") ||
      typeof item.createdAt !== "string" ||
      !/^hybrid_20260905_\d{4}$/.test(item.recipientId ?? "") ||
      !/^sffs_hybrid_20260905_\d{4}$/.test(item.idempotencyKey ?? "")
    ) {
      return null;
    }
    const normalized = { email, source:item.source, createdAt:item.createdAt, variant:item.variant, recipientId:item.recipientId, idempotencyKey:item.idempotencyKey };
    if (!HASHES.has(createHash("sha256").update(JSON.stringify(normalized)).digest("hex"))) return null;
    recipients.push(normalized as Recipient);
  }

  if (
    new Set(recipients.map((r) => r.email)).size !== recipients.length ||
    new Set(recipients.map((r) => r.recipientId)).size !== recipients.length ||
    new Set(recipients.map((r) => r.idempotencyKey)).size !== recipients.length
  ) {
    return null;
  }
  return recipients;
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as
    | { action?: unknown; confirmation?: unknown; recipients?: unknown }
    | null;
  if (body?.confirmation !== CONFIRMATION) {
    return NextResponse.json({ ok: false, error: "confirmation_mismatch" }, { status: 400 });
  }
  if (body.action === "audit") {
    async function read(path: string) {
      const r = await fetch("https://api.resend.com" + path, {headers:{authorization:`Bearer ${process.env.HYBRID_RESEND_API_KEY?.trim()}`},cache:"no-store"});
      if (!r.ok) throw new Error(`Provider audit failed: ${r.status}`);
      return r.json();
    }
    const domains = await read("/domains");
    const hooks = await read("/webhooks");
    const old = await read("/emails/26f642ad-0836-43b4-8b50-f8573915b878");
    const raw = JSON.stringify(old);
    const oldTokens = [...raw.matchAll(/unsubscribe\?t=([A-Za-z0-9_.-]+)/g)].map(m=>m[1]);
    const validOldUnsubscribe = oldTokens.some(t=>decodeUnsubscribeToken(t).ok);
    return NextResponse.json({
      ok:validOldUnsubscribe, validOldUnsubscribe, oldTokenCount:oldTokens.length,
      domains:domains.data?.map((d: {name:string;status:string})=>({name:d.name,status:d.status})),
      hooks:hooks.data?.map((h:{id:string;endpoint:string;status:string;events:string[]})=>({id:h.id,endpoint:h.endpoint,status:h.status,events:h.events})),
      qaUnsubscribeUrl:unsubscribeUrlFor("campaign-qa-20260905@example.com"),
      qaClickUrl:launchClickUrlFor({campaign:"app-launch-hybrid-2026-09-05",variant:"a",recipientId:"qa_hybrid_20260905"}),
    },{headers:{"cache-control":"no-store"}});
  }
  const recipients = parseRecipients(body?.recipients, body?.action);
  if (!recipients) {
    return NextResponse.json({ ok: false, error: "invalid_manifest" }, { status: 400 });
  }

  // Both independent stop lists must be readable immediately before sending:
  // our unsubscribe database and Resend's team-wide bounce/complaint list.
  // Any lookup error throws and the route sends nothing.
  const [local, provider] = await Promise.all([
    filterSuppressed(recipients.map((r) => r.email)),
    providerSuppressions(),
  ]);
  const suppressed = new Set([
    ...local.suppressed,
    ...recipients.map((r) => r.email).filter((email) => provider.has(email)),
  ]);
  if (body?.action === "preflight") {
    return NextResponse.json(
      { ok: true, count: recipients.length, suppressedIds: recipients.filter(r=>suppressed.has(r.email)).map(r=>r.recipientId) },
      { status: 200, headers: { "cache-control": "no-store" } },
    );
  }
  if (suppressed.size > 0) {
    return NextResponse.json(
      { ok: false, error: "recipient_suppressed", count: suppressed.size },
      { status: 409 },
    );
  }

  const previousSwitch = process.env.PRODUCT_EMAIL_ENABLED;
  process.env.PRODUCT_EMAIL_ENABLED = "1";
  const sent: Array<{ recipientId: string; variant: LaunchVariant; id: string }> = [];
  try {
    for (const recipient of recipients) {
      const rendered = renderNextLaunchIteration({
        ctaUrl: launchClickUrlFor({ campaign: "app-launch-hybrid-2026-09-05", variant: recipient.variant, recipientId: recipient.recipientId }),
        unsubscribeUrl: unsubscribeUrlFor(recipient.email),
      });
      const result = await sendProductEmail({
        to: recipient.email,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        idempotencyKey: recipient.idempotencyKey,
        campaignTracking: {
          campaign: "app-launch-hybrid-2026-09-05",
          variant: recipient.variant,
          recipientId: recipient.recipientId,
        },
      });
      if (!result.ok) {
        return NextResponse.json(
          { ok: false, error: "send_failed", reason: result.reason, sent },
          { status: 502 },
        );
      }
      sent.push({ recipientId: recipient.recipientId, variant: recipient.variant, id: result.id });
    }
  } finally {
    if (previousSwitch === undefined) delete process.env.PRODUCT_EMAIL_ENABLED;
    else process.env.PRODUCT_EMAIL_ENABLED = previousSwitch;
  }

  return NextResponse.json(
    { ok: true, count: sent.length, sent },
    { headers: { "cache-control": "no-store" } },
  );
}
