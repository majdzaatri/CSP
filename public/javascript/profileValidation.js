const password=document.getElementById('newPassword')
const confirmPass=document.getElementById('confirmPass')
const submit=document.getElementById('changeBtn')
const formlabelgroup = document.getElementById('validation').parentElement;



submit.addEventListener('click' , (e) => {
  e.preventDefault();
  checkInput();      
})


function checkInput()
{
    
         let passwordregx= /^(?=.*\d)[a-zA-Z\d]{1,}$/;
         let passwordlength=/^.{6,25}$/;
         if(passwordlength.test(password.value)==0)
         {
            const passlength = formlabelgroup.querySelector('passlength').style.color='red';
         }
         else{
            const passlength = formlabelgroup.querySelector('passlength').style.color='green';
        }
         if(passwordregx.test(password.value)==0)
         {
            const passnum= formlabelgroup.querySelector('passnum').style.color='red';
         }
         else{
            const passnum= formlabelgroup.querySelector('passnum').style.color='green';
         }
        if(confirmPass.value!==password.value)
         {
            const passmatch = formlabelgroup.querySelector('passmatch').style.color='red';
         }
         else{
            const passmatch = formlabelgroup.querySelector('passmatch').style.color='green';
        }
}
