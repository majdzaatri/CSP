//Signup//
const firstName=document.getElementById('firstname')
const lastName=document.getElementById('lastname')
const email=document.getElementById('email')
const password=document.getElementById('password')
const confirmPass=document.getElementById('confirmPass')
const promocode=document.getElementById('promocode')
const submit=document.getElementById('submitBtn')


submit.addEventListener('click' , (e) => {
  e.preventDefault();
  checkInput();      
})


function checkInput()
{
    let regx=/^[a-z ,.'-,A-Z]+$/;
    if(!regx.test(lastName.value))
    {
        setErrorFor(lastName,' Last name must be in letters only');
    }
    else
        setSuccessFor(lastName);
 
     if(!regx.test(firstName.value))
     {
        setErrorFor(firstName,'First name must be in letters only');
     }
     else
        setSuccessFor(firstName);
 
   
      regx=/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
 
         if(!regx.test(email.value))
         {
            setErrorFor(email,' Email must be in xxx@yyy.zzz format');
         }
         else
            setSuccessFor(email);
         
         let passwordregx= /^(?=.*\d)(?=.*[a-zA-Z]).{6,25}$/;
         if(password.value==='' || password.value===null)
         {
            setErrorFor(password,' Password is blank');
         }
        else if(!passwordregx.test(password.value))
         {
            setErrorFor(password," Password's length must be at least 6 and must include at least 1 digit");
         }
         else
            setSuccessFor(password);
         if(confirmPass.value==='' || confirmPass.value===null)
         {
            setErrorFor(confirmPass," Confirm Password is blank");
         }
        else if(confirmPass.value!==password.value)
         {
             setErrorFor(confirmPass," Please make sure it matches your password");
         }
         else {
            console.log('success');
               setSuccessFor(confirmPass);
        }
}
function setErrorFor(input, message) {
	const formlabelgroup = input.parentElement;
	const small = formlabelgroup.querySelector('small');
	formlabelgroup.className = 'form-label-group error';
	small.innerText = message;
}

function setSuccessFor(input) {
	const formlabelgroup = input.parentElement;
	formlabelgroup.className = 'form-label-group success';
}