var express = require('express');
var session = require('express-session');
var FileStore = require('session-file-store')(session);
var bodyParser = require('body-parser');
var bkfd2Password = require("pbkdf2-password");
// pspt-1 불러오기
//// pspt-fb-1 불러오기
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var hasher = bkfd2Password();
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  store: new FileStore(),
  secret: '1234DSFs@adf1234!@#$asd',
  resave: false,
  saveUninitialized: true
}));
// pspt-2 미들웨어 삽입
app.use(passport.initialize());
app.use(passport.session());

app.get('/count', function(req,res){
  if(req.session.count){
    req.session.count++;
  } else {
    req.session.count = 1;
  }
  res.send('count :' + req.session.count);
})


// 셋째,
// 로그인 성공시 req.sesssion.Display 있으니 체크 후
// logout 가능 화면 표시
// 아니면 로그인 버튼 화면 표시
// MultiUser-1 Register 버튼 삽입
//// pspt-6 req.user를 만들고 그안에 user에 대한 정보를 등록하는데
//// 그 것은 deseciralizeUser의 done 함수의 user에서 기인함
app.get('/welcome', function(req, res){
  if(req.user && req.user.displayName){
    res.send(`
      <h1>Hello, ${req.user.displayName}</h1>
      <a href="/auth/logout">logout</a>
    `)
  } else {
    res.send(`
      <h1>Welcome</h1>
      <ul>
        <li><a href="/auth/login">Login</a></li>
        <li><a href="/auth/register">Register</a></li>
      </ul>
    `);
  }
})

// 넷째,
// 로그 아웃시 세션 지우고 welcome으로 리다이렉션
// welcome에서는 session.displayName 없으니깐
// 로그인 버튼 화면 표시
//// pspt-7 아래 로그아웃
app.get('/auth/logout', function(req, res){
  req.logout()
  req.session.save(function(){
    res.redirect('/welcome')
  })
})



// 둘째,
// req.body.username과 pwd를 받아서 DB의 user정보와 비교
// DB의 displayName을 세션에 담아서 /welcome으로 redirection
// 로그인 실패시 Who are you 전송
// MultiUser-5 users에 있는 것을 투프돌며 user에 담아서 아이디, 비번 체크
// 루프를 다 돌고 res.send가 실행되기 때문에 중간에 값이 맞으면 redirect 바로 시켜주기위해
// req.session.save앞에 return을 걸어줌

//// Security-2 username 있느지 먼저 체크 후
//// 유저가 입력한  pwd와 유저 가입시 생성된 salt값을 붙여서 나온 hash 값이 기존 우리가 들고있던 user.password 값과 맞는지 비교
//// 여기서 hasher 앞에 return을 붙이는 이유는 hasher는 콜백퍽션을 인자로 받고 있음.
//// hasher는 실행하는 즉시 끝나버림. 그리고 나중에 퍽션콜백이 호출됨..
//// 그래서 일단 hasher가 실행되고 for문이 뺑글뺑글돔.
//// 그 다음 맨 밑에 who are you 가 송출되고 이 작업이 끝나게됨,, 그리고 아주 나중에 저 콜백함수가 실행됨.
// app.post('/auth/login', function(req, res){
//   var uname = req.body.username;
//   var pwd = req.body.password;
//   for (var i=0; i < users.length; i++){
//     var user=users[i];
//     if(uname === user.username){
//       return hasher({password:pwd, salt:user.salt}, function(err, pass, salt, hash){
//         if(hash === user.password) {
//           req.session.displayName = user.displayName;
//           req.session.save(function(){
//             res.redirect('/welcome')
//           })
//         } else {
//           res.send('Who Are you? <a href="/auth/login">login</a>');
//         }
//       })
//     }
//   }
//   res.send('Who Are you? <a href="/auth/login">login</a>');
// })

// pspt-4 아래 pspt-3에서 done이 false가 아니면 아래 것이 실행
// 세션에 저장
//// pspt-fb-8 username 대신에 authId값을 줌
passport.serializeUser(function(user, done) {
  console.log('serializeUser', user)
  done(null, user.authId);
});

// pspt-5 아래 pspt-3에서 done이 false면 아래 것이 실행
// 여기서 id는 위 user.username이 됨
// 사용자가 들어올 때 마다 사용자를 검색해서 done이란 함수를 호출하고 사용자의 정보를 줌
//// pspt-fb-9 username 대신에 authId 값을 줌
//// pspt-fb-10 서버를 꺼도 세션 정보는 파일에 저장되 있어서 살아있는데, 그 유저의 정보(DB배열)은
//// 메모리상에서 사라진 상태..
passport.deserializeUser(function(id, done) {
  console.log('deserializeUser', id)
  for (var i=0; i < users.length; i++){
    var user = users[i];
    if(user.authId===id) {
      return done(null, user);
    }
  }
  done('There is no user.')
});

// pspt-3 설정파일 설정
// 기존에 사용자가 맞는지 확인
passport.use(new LocalStrategy(
  function(username, password, done) {
    var uname = username;
    var pwd = password;
    for (var i=0; i < users.length; i++){
      var user=users[i];
      if(uname === user.username){
        return hasher({password:pwd, salt:user.salt}, function(err, pass, salt, hash){
          if(hash === user.password) {
            console.log('LocalStrategy', user)
            done(null, user);
            // req.session.displayName = user.displayName;
            // req.session.save(function(){
            //   res.redirect('/welcome')
            // })
          } else {
            done(null, false);
            // res.send('Who Are you? <a href="/auth/login">login</a>');
          }
        })
      }
    }
    done(null, false);
    // res.send('Who Are you? <a href="/auth/login">login</a>');
  }
));

//// pspt-fb-4 FacebookStrategy 전략 설정
//// 앱ID, 시크릿키, 콜백URL 입력!
//// console.log로 무슨값이 오는지 보고
//// 그 값을 받아서 authId에 unique한 값으로 넣는다
//// user DB에 for문을 돌면서 받아온 authId가 DB에 있는 user.authId와 맞는게 있는지 확인
//// 있으면 return으로 빠져나옴.
//// 없으면 newuser에 정보를 담아서 users DB에 PUSH한 후에 newuser를 반환
passport.use(new FacebookStrategy({
  clientID: '1874065032903590',
  clientSecret: '8be4344b9c77b568ad9bb21644cbc7d8',
  callbackURL: "/auth/facebook/callback"
},
function(accessToken, refreshToken, profile, done) {
  console.log('FB!!', profile);
  var authId = 'facebook:' + profile.id;
  for (var i = 0; i<users.length; i++){
    var user=users[i];
    if(user.authId === authId ){
      return done(null, user);
    }
  }
  var newuser = {
    'authId' : authId,
    'displayName': profile.displayName
  }
  users.push(newuser);
  done(null, newuser);
}
));

// pspt-3 URL 설정
app.post('/auth/login', 
    passport.authenticate('local', { 
    successRedirect: '/welcome',
    failureRedirect: '/auth/login',
    failureFlash: false 
  })
);

//// pspt-fb-3 FACEBOOK 으로 들어오면 facebook 전략을 쓰겠다!
app.get('/auth/facebook', 
  passport.authenticate(
    'facebook'
  )
);

//// pspt-fb-5 인증 후 두번째 왕복은 이리로 들어옴
app.get('/auth/facebook/callback',
  passport.authenticate(
    'facebook', 
    { 
      successRedirect: '/welcome',
      failureRedirect: '/auth/login'
    }
  )
);

// 첫째,
// 로그인 화면
//// pspt-fb-2 FACEBOOK 링크 추가
app.get('/auth/login', function(req, res){
  console.log(users)
  var output = `
  <h1>LOGIN</h1>
  <form action="/auth/login" method="post">
    <p>
      <input type="text" name="username"
      placeholder="username">
    </p>
    <p>
      <input type="password" name="password"
      placeholder="password">
    </p>
    <p>
      <input type="submit">
    </p>
  </form>
  <a href="/auth/facebook">FACEBOOK</a>
  `;
  res.send(output)
})

//MultiUser-3 가입페이지에서 post방식으로 넘어온 데이터 파싱
//아래 MultiUser-4의 사용자 정보 DB에 밀어넣고
//세션값을 준 다음에 /welcome으로 리다이렉트

//// Security-3 가입 시 
//// password와 salt에 hash와 salt를 산출해서 넣어줌

////pspt-8 회원가입 후 로그인 페이지말고 환영인사 페이지로 바로 보내기

//// pspt-fb-7 authid를 부여함(OAuth 유저와 맞출려고)
app.post('/auth/register', function(req, res){
  hasher({password: req.body.password}, function(err,pass,salt,hash){
    var user = {
      authId: 'local:'+req.body.username,
      username: req.body.username,
      password: hash,
      salt: salt,
      displayName: req.body.displayName
    }
    users.push(user);
    req.login(user, function(err) {
      req.session.save(function(){
        res.redirect('/welcome'); 
      });
    });
  })
})


//MultiUser-4 사용자 정보 DB
//// Security-1 bkfd2Password로 뽑아낸 값들 입력
//// pspt-fb-6 authid를 부여함(OAuth 유저와 맞출려고)
var users  = [
  {
    authId: 'local:egoing',
    username: 'egoing',
    password: 'jwuSz3R6xIEOqpYcwe3jA0dvL3AxQGIaAVnCp19//B+BluaKkpukgNE6CwWUtH7A9N2ZUn9ozD/EzQEXPnYVocm69QyX6R58qHOLM5TmPDLjsLvqq0q+q3w7XihGGcSJp6cUIcpoaP0+1p9UQL+qgGze0mYRChoI6JAfJemozFY=',
    salt: 'sjLEAEAt9F+e9WBAITNKMZnvECmAypuAHeK5mnOeL+mTBecWpQ1nE1PuZI8MKk0aYKzmpxjbFQxBnLGuVSvDdA==',
    displayName: 'Egoing'
  }
]

//MultiUser-2 가입 페이지 완성
//post 방식으로 /auth/register로 전송
app.get('/auth/register', function(req, res){
  var output = `
  <h1>Register</h1>
    <form action="/auth/register" method="post">
    <p>
      <input type="text" name="username"
      placeholder="username">
    </p>
    <p>
      <input type="password" name="password"
      placeholder="password">
    </p>
    <p>
      <input type="text" name="displayName"
      placeholder="displayName">
    </p>
    <p>
      <input type="submit">
    </p>
  </form>
  `;
  res.send(output);
})

app.listen(3003, function(){
  console.log('Connected 3003 port!!!');
});
